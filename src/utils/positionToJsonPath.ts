/**
 * Utility to find the JSON path from a cursor position in a formatted JSON string
 */

export interface JsonPathSegment {
  /** The key or index at this level */
  key: string | number
  /** The display text for breadcrumb */
  label: string
  /** The full path from root to this segment (dot notation) */
  path: string
}

export interface JsonPathResult {
  /** Array of path segments from root to cursor */
  segments: JsonPathSegment[]
  /** Full JSONPath string (e.g., "$.users[0].name") */
  jsonPath: string
  /** Dot notation path (e.g., "users.0.name") */
  dotPath: string
}

/**
 * Find the JSON path at a given cursor position in a formatted JSON string
 * @param jsonString - The formatted JSON string
 * @param lineNumber - 1-based line number
 * @param column - 1-based column number
 * @returns JsonPathResult or null if position is invalid
 */
export function getJsonPathAtPosition(
  jsonString: string,
  lineNumber: number,
  column: number,
): JsonPathResult | null {
  // Convert line/column to offset
  const lines = jsonString.split('\n')
  if (lineNumber < 1 || lineNumber > lines.length) {
    return null
  }

  let offset = 0
  for (let i = 0; i < lineNumber - 1; i++) {
    offset += lines[i]!.length + 1 // +1 for newline
  }
  offset += Math.min(column - 1, lines[lineNumber - 1]!.length)

  // Parse JSON and track path
  const pathStack: JsonPathSegment[] = []
  let pos = 0

  try {
    // Validate JSON first
    JSON.parse(jsonString)
  }
  catch {
    return null
  }

  function skipWhitespace() {
    while (pos < jsonString.length && /\s/.test(jsonString[pos]!)) {
      pos++
    }
  }

  function parseString(): string {
    pos++ // Skip opening quote
    let str = ''
    while (pos < jsonString.length && jsonString[pos] !== '"') {
      if (jsonString[pos] === '\\') {
        pos++
        if (pos < jsonString.length) {
          const escapeChar = jsonString[pos]
          switch (escapeChar) {
            case 'n':
              str += '\n'
              break
            case 'r':
              str += '\r'
              break
            case 't':
              str += '\t'
              break
            case '\\':
              str += '\\'
              break
            case '"':
              str += '"'
              break
            case '/':
              str += '/'
              break
            case 'b':
              str += '\b'
              break
            case 'f':
              str += '\f'
              break
            case 'u': {
              const hex = jsonString.substring(pos + 1, pos + 5)
              str += String.fromCharCode(Number.parseInt(hex, 16))
              pos += 4
              break
            }
            default: str += escapeChar
          }
        }
      }
      else {
        str += jsonString[pos]
      }
      pos++
    }
    pos++ // Skip closing quote
    return str
  }

  function buildPath(segments: JsonPathSegment[]): string {
    if (segments.length === 0)
      return ''
    return segments.map(s => s.key).join('.')
  }

  function buildJsonPath(segments: JsonPathSegment[]): string {
    if (segments.length === 0)
      return '$'
    let result = '$'
    for (const seg of segments) {
      if (typeof seg.key === 'number') {
        result += `[${seg.key}]`
      }
      else if (/^[a-z_$][\w$]*$/i.test(seg.key)) {
        result += `.${seg.key}`
      }
      else {
        result += `["${seg.key.replace(/"/g, '\\"')}"]`
      }
    }
    return result
  }

  function parseValue(): boolean {
    skipWhitespace()

    if (pos > offset) {
      return true // We've passed the cursor
    }

    const char = jsonString[pos]

    if (char === '{') {
      return parseObject()
    }
    else if (char === '[') {
      return parseArray()
    }
    else if (char === '"') {
      parseString()
      return pos > offset
    }
    else if (char === 't') {
      pos += 4 // true
      return pos > offset
    }
    else if (char === 'f') {
      pos += 5 // false
      return pos > offset
    }
    else if (char === 'n') {
      pos += 4 // null
      return pos > offset
    }
    else {
      // Number
      while (pos < jsonString.length && /[0-9.e+\-]/i.test(jsonString[pos]!)) {
        pos++
      }
      return pos > offset
    }
  }

  function parseObject(): boolean {
    pos++ // Skip {
    skipWhitespace()

    if (pos > offset) {
      return true
    }

    // Track the last valid key for when cursor is on closing brace or comma
    let lastKey: { key: string, dotPath: string, fullPath: string } | null = null

    while (pos < jsonString.length && jsonString[pos] !== '}') {
      skipWhitespace()

      if (jsonString[pos] !== '"') {
        break
      }

      const keyStart = pos
      const key = parseString()
      const keyEnd = pos

      skipWhitespace()
      pos++ // Skip :
      skipWhitespace()

      const dotPath = buildPath(pathStack)
      const fullPath = dotPath ? `${dotPath}.${key}` : String(key)

      // Check if cursor is on or before the key
      if (offset >= keyStart && offset < keyEnd) {
        // Cursor is on this key, add it to path
        pathStack.push({
          key,
          label: key,
          path: fullPath,
        })
        return true
      }

      // Push key to path before parsing value
      pathStack.push({
        key,
        label: key,
        path: fullPath,
      })

      const found = parseValue()
      if (found) {
        return true
      }

      // Remember this key as the last one we processed
      lastKey = { key, dotPath, fullPath }

      // Pop key since cursor wasn't in this value
      pathStack.pop()

      skipWhitespace()
      if (jsonString[pos] === ',') {
        pos++
        // If cursor is on the comma after this value, it belongs to this key
        if (pos > offset && lastKey) {
          pathStack.push({
            key: lastKey.key,
            label: lastKey.key,
            path: lastKey.fullPath,
          })
          return true
        }
      }
    }

    // If cursor is on closing brace, it belongs to the last key if there is one
    if (jsonString[pos] === '}') {
      if (offset === pos && lastKey) {
        pathStack.push({
          key: lastKey.key,
          label: lastKey.key,
          path: lastKey.fullPath,
        })
        pos++
        return true
      }
      pos++
    }

    return pos > offset
  }

  function parseArray(): boolean {
    pos++ // Skip [
    skipWhitespace()

    if (pos > offset) {
      return true
    }

    // Track the last valid index for when cursor is on closing bracket or comma
    let lastIndex: { index: number, fullPath: string } | null = null

    let index = 0
    while (pos < jsonString.length && jsonString[pos] !== ']') {
      skipWhitespace()

      const dotPath = buildPath(pathStack)
      const fullPath = dotPath ? `${dotPath}.${index}` : String(index)
      pathStack.push({
        key: index,
        label: `[${index}]`,
        path: fullPath,
      })

      const found = parseValue()
      if (found) {
        return true
      }

      // Remember this index as the last one we processed
      lastIndex = { index, fullPath }

      // Pop index since cursor wasn't in this element
      pathStack.pop()

      skipWhitespace()
      if (jsonString[pos] === ',') {
        pos++
        // If cursor is on the comma after this value, it belongs to this index
        if (pos > offset && lastIndex) {
          pathStack.push({
            key: lastIndex.index,
            label: `[${lastIndex.index}]`,
            path: lastIndex.fullPath,
          })
          return true
        }
        index++
      }
      else {
        break
      }
    }

    // If cursor is on closing bracket, it belongs to the last index if there is one
    if (jsonString[pos] === ']') {
      if (offset === pos && lastIndex) {
        pathStack.push({
          key: lastIndex.index,
          label: `[${lastIndex.index}]`,
          path: lastIndex.fullPath,
        })
        pos++
        return true
      }
      pos++
    }

    return pos > offset
  }

  // Start parsing
  skipWhitespace()
  parseValue()

  return {
    segments: pathStack,
    jsonPath: buildJsonPath(pathStack),
    dotPath: buildPath(pathStack),
  }
}
