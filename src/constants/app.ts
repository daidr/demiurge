/**
 * Application-wide constants
 */

// Time intervals (in milliseconds)
export const INTERVALS = {
  /** Storage polling interval - 30 seconds */
  STORAGE_POLL: 30_000,
  /** Default debounce delay - 300ms */
  DEBOUNCE_DEFAULT: 300,
  /** Search input debounce - 150ms */
  DEBOUNCE_SEARCH: 150,
  /** Cursor position update debounce - 100ms */
  CURSOR_DEBOUNCE: 100,
} as const

// UI size constants (in pixels or percentages)
export const SIZES = {
  /** Minimum panel size percentage */
  PANEL_MIN: 35,
  /** Tab item height in sidebar */
  TAB_ITEM_HEIGHT: 28,
  /** Tree item height in size viewer */
  TREE_ITEM_HEIGHT: 28,
  /** Minimum sidebar width */
  SIDEBAR_MIN_WIDTH: 200,
} as const

// Default values
export const DEFAULTS = {
  /** Default tree expansion depth for size viewer */
  TREE_EXPAND_DEPTH: 2,
  /** Maximum tab title length */
  MAX_TAB_TITLE_LENGTH: 50,
} as const
