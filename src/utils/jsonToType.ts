/**
 * Generate TypeScript type definition from a JSON value
 */
export function jsonToTypeDefinition(value: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent)

  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]'
    }
    // Get unique types from array elements
    const elementTypes = new Set<string>()
    for (const item of value.slice(0, 10)) { // Sample first 10 items for performance
      elementTypes.add(jsonToTypeDefinition(item, indent))
    }
    if (elementTypes.size === 1) {
      return `${[...elementTypes][0]}[]`
    }
    return `(${[...elementTypes].join(' | ')})[]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return 'Record<string, unknown>'
    }
    const props = entries.map(([key, val]) => {
      const safeKey = /^[a-z_$]\w*$/i.test(key) ? key : `"${key}"`
      return `${spaces}  ${safeKey}: ${jsonToTypeDefinition(val, indent + 1)}`
    })
    return `{\n${props.join(';\n')};\n${spaces}}`
  }

  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'unknown'
  }
}

/**
 * Generate a TypeScript declaration for the playground context.
 * Provides `$` and `data` as typed references to the JSON data.
 */
export function generateThisTypeDeclaration(jsonString: string): string | null {
  try {
    const parsed = JSON.parse(jsonString)
    const typeDefinition = jsonToTypeDefinition(parsed)
    return `
/** The JSON data object */
declare const $: ${typeDefinition};
/** Alias for $ */
declare const data: typeof $;
`
  }
  catch {
    return null
  }
}
