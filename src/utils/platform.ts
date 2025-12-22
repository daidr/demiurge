/**
 * Detect if current platform is macOS
 */
export function isMac(): boolean {
  return navigator.platform.toLowerCase().includes('mac')
}
