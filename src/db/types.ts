// Workspace Collection Types
export interface Workspace {
  id: string // uuidv7
  title: string
  icon: string // emoji
  createdTime: number
  updatedTime: number
  tabOrder: string[] // Tab IDs in order
}

// Tab Collection Types
export type InteractiveTool = 'size-viewer' | 'playground' | 'type-stats'
export type SizeViewerMode = 'tree' | 'sunburst'
export type PlaygroundMode = 'javascript' | 'jsonpath'

export interface Tab {
  id: string // uuidv7
  workspaceId: string
  title: string
  createdTime: number
  updatedTime: number

  // JSON content
  content: string

  // Schema reference
  schemaId: string | null

  // Tool state (per-tab persistence)
  activeToolTab: InteractiveTool

  // Size Viewer state
  sizeViewerMode: SizeViewerMode
  flattenEnabled: boolean

  // Playground state
  playgroundMode: PlaygroundMode
  playgroundExpression: string
  playgroundAutoRun: boolean
}

// Schema Collection Types
export interface Schema {
  id: string // uuidv7
  name: string
  content: string
  createdTime: number
  updatedTime: number
}

// App State Collection Types
export interface AppState {
  id: 'singleton'
  activeWorkspaceId: string | null
  activeTabId: string | null
  // Layout state
  sidebarOpen: boolean
  sidebarFloating: boolean
}

// Playground Snippet Collection Types
export interface PlaygroundSnippet {
  id: string // uuidv7
  name: string
  content: string
  mode: PlaygroundMode
  createdTime: number
  updatedTime: number
}
