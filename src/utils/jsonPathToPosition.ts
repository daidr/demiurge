/**
 * Utility to find the position of a JSON path in a formatted JSON string
 */

export interface JsonPosition {
  line: number
  column: number
  endLine: number
  endColumn: number
}

/**
 * Parse a path string into segments
 * Handles both dot notation (a.b.c) and bracket notation (a[0].b)
 */
function parsePathSegments(path: string): (string | number)[] {
  if (!path)
    return []

  const segments: (string | number)[] = []
  let current = ''
  let i = 0

  while (i < path.length) {
    const char = path[i]

    if (char === '.') {
      if (current) {
        segments.push(current)
        current = ''
      }
      i++
    }
    else if (char === '[') {
      if (current) {
        segments.push(current)
        current = ''
      }
      i++
      // Parse the index
      let indexStr = ''
      while (i < path.length && path[i] !== ']') {
        indexStr += path[i]
        i++
      }
      i++ // Skip ']'
      segments.push(Number.parseInt(indexStr, 10))
    }
    else {
      current += char
      i++
    }
  }

  if (current) {
    segments.push(current)
  }

  return segments
}

/**
 * Find the position of a JSON path in a formatted JSON string
 * Returns the line and column where the key/value starts
 */
export function findJsonPathPosition(jsonString: string, path: string): JsonPosition | null {
  const segments = parsePathSegments(path)

  // If no segments (root), return the start of the JSON
  if (segments.length === 0) {
    return {
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 2,
    }
  }

  let currentOffset = 0
  let currentLine = 1
  let currentColumn = 1

  // Helper to update line/column tracking
  function advanceTo(targetOffset: number) {
    while (currentOffset < targetOffset && currentOffset < jsonString.length) {
      if (jsonString[currentOffset] === '\n') {
        currentLine++
        currentColumn = 1
      }
      else {
        currentColumn++
      }
      currentOffset++
    }
  }

  // Helper to skip whitespace
  function skipWhitespace() {
    while (currentOffset < jsonString.length && /\s/.test(jsonString[currentOffset]!)) {
      advanceTo(currentOffset + 1)
    }
  }

  // Helper to find the end of a JSON value (for selection)
  function findValueEnd(): { line: number, column: number } {
    let depth = 0
    let inString = false
    let escaped = false

    while (currentOffset < jsonString.length) {
      const char = jsonString[currentOffset]

      if (escaped) {
        escaped = false
        advanceTo(currentOffset + 1)
        continue
      }

      if (char === '\\' && inString) {
        escaped = true
        advanceTo(currentOffset + 1)
        continue
      }

      if (char === '"' && !escaped) {
        inString = !inString
        advanceTo(currentOffset + 1)
        continue
      }

      if (!inString) {
        if (char === '{' || char === '[') {
          depth++
        }
        else if (char === '}' || char === ']') {
          if (depth === 0) {
            // End of value
            return { line: currentLine, column: currentColumn }
          }
          depth--
        }
        else if ((char === ',' || char === '\n') && depth === 0) {
          // End of value
          return { line: currentLine, column: currentColumn }
        }
      }

      advanceTo(currentOffset + 1)
    }

    return { line: currentLine, column: currentColumn }
  }

  // Start parsing
  skipWhitespace()

  // Navigate through each segment
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex]
    skipWhitespace()

    if (typeof segment === 'number') {
      // Array index
      if (jsonString[currentOffset] !== '[') {
        return null // Expected array
      }
      advanceTo(currentOffset + 1) // Skip '['
      skipWhitespace()

      // Skip to the target index
      for (let i = 0; i < segment; i++) {
        // Skip the current value
        skipValue()
        skipWhitespace()
        if (jsonString[currentOffset] === ',') {
          advanceTo(currentOffset + 1) // Skip ','
          skipWhitespace()
        }
      }

      // Now we're at the target index
      if (segmentIndex === segments.length - 1) {
        // This is the final segment, return position
        const startLine = currentLine
        const startColumn = currentColumn
        const end = findValueEnd()
        return {
          line: startLine,
          column: startColumn,
          endLine: end.line,
          endColumn: end.column,
        }
      }
    }
    else {
      // Object key
      if (jsonString[currentOffset] !== '{') {
        return null // Expected object
      }
      advanceTo(currentOffset + 1) // Skip '{'
      skipWhitespace()

      // Find the target key
      let found = false
      while (currentOffset < jsonString.length && jsonString[currentOffset] !== '}') {
        skipWhitespace()

        // Parse key
        if (jsonString[currentOffset] !== '"') {
          return null // Expected string key
        }
        const keyStart = currentOffset
        advanceTo(currentOffset + 1) // Skip opening quote
        let key = ''
        while (currentOffset < jsonString.length && jsonString[currentOffset] !== '"') {
          if (jsonString[currentOffset] === '\\') {
            advanceTo(currentOffset + 1)
            if (currentOffset < jsonString.length) {
              key += jsonString[currentOffset]
              advanceTo(currentOffset + 1)
            }
          }
          else {
            key += jsonString[currentOffset]
            advanceTo(currentOffset + 1)
          }
        }
        advanceTo(currentOffset + 1) // Skip closing quote

        skipWhitespace()
        if (jsonString[currentOffset] !== ':') {
          return null // Expected colon
        }
        advanceTo(currentOffset + 1) // Skip ':'
        skipWhitespace()

        if (key === segment) {
          found = true
          if (segmentIndex === segments.length - 1) {
            // This is the final segment, return position of key
            // Go back to key start for better UX
            let keyLine = 1
            let keyColumn = 1
            for (let i = 0; i < keyStart; i++) {
              if (jsonString[i] === '\n') {
                keyLine++
                keyColumn = 1
              }
              else {
                keyColumn++
              }
            }
            const end = findValueEnd()
            return {
              line: keyLine,
              column: keyColumn,
              endLine: end.line,
              endColumn: end.column,
            }
          }
          break
        }
        else {
          // Skip this value and continue
          skipValue()
          skipWhitespace()
          if (jsonString[currentOffset] === ',') {
            advanceTo(currentOffset + 1) // Skip ','
          }
        }
      }

      if (!found) {
        return null // Key not found
      }
    }
  }

  return null

  // Helper to skip a JSON value
  function skipValue() {
    skipWhitespace()
    const char = jsonString[currentOffset]

    if (char === '"') {
      // String
      advanceTo(currentOffset + 1)
      while (currentOffset < jsonString.length) {
        if (jsonString[currentOffset] === '\\') {
          advanceTo(currentOffset + 2)
        }
        else if (jsonString[currentOffset] === '"') {
          advanceTo(currentOffset + 1)
          break
        }
        else {
          advanceTo(currentOffset + 1)
        }
      }
    }
    else if (char === '{') {
      // Object
      let depth = 1
      advanceTo(currentOffset + 1)
      let inStr = false
      while (currentOffset < jsonString.length && depth > 0) {
        const c = jsonString[currentOffset]
        if (c === '\\' && inStr) {
          advanceTo(currentOffset + 2)
          continue
        }
        if (c === '"')
          inStr = !inStr
        if (!inStr) {
          if (c === '{')
            depth++
          else if (c === '}')
            depth--
        }
        advanceTo(currentOffset + 1)
      }
    }
    else if (char === '[') {
      // Array
      let depth = 1
      advanceTo(currentOffset + 1)
      let inStr = false
      while (currentOffset < jsonString.length && depth > 0) {
        const c = jsonString[currentOffset]
        if (c === '\\' && inStr) {
          advanceTo(currentOffset + 2)
          continue
        }
        if (c === '"')
          inStr = !inStr
        if (!inStr) {
          if (c === '[')
            depth++
          else if (c === ']')
            depth--
        }
        advanceTo(currentOffset + 1)
      }
    }
    else {
      // Number, boolean, null
      while (currentOffset < jsonString.length) {
        const c = jsonString[currentOffset]
        if (c && /[,}\]\s]/.test(c))
          break
        advanceTo(currentOffset + 1)
      }
    }
  }
}
