/**
 * Try to format JSON string. Returns formatted JSON if valid, otherwise returns original string.
 */
export function tryFormatJson(content: string): string {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  }
  catch {
    return content
  }
}

/**
 * Check if a string is valid JSON.
 */
export function isValidJson(content: string): boolean {
  try {
    JSON.parse(content)
    return true
  }
  catch {
    return false
  }
}
