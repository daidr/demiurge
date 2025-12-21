import type { AppState, PlaygroundSnippet, Schema, Tab, Workspace } from './types'
import { Collection } from '@signaldb/core'
import createOPFSAdapter from '@signaldb/opfs'
import reactivityAdapter from '@signaldb/vue'

// Workspaces Collection
export const workspacesCollection = new Collection<Workspace>({
  persistence: createOPFSAdapter('demiurge-workspaces.json'),
  reactivity: reactivityAdapter,
})

// Tabs Collection
export const tabsCollection = new Collection<Tab>({
  persistence: createOPFSAdapter('demiurge-tabs.json'),
  reactivity: reactivityAdapter,
})

// Schemas Collection
export const schemasCollection = new Collection<Schema>({
  persistence: createOPFSAdapter('demiurge-schemas.json'),
  reactivity: reactivityAdapter,
})

// App State Collection (singleton)
export const appStateCollection = new Collection<AppState>({
  persistence: createOPFSAdapter('demiurge-app-state.json'),
  reactivity: reactivityAdapter,
})

// Playground Snippets Collection
export const snippetsCollection = new Collection<PlaygroundSnippet>({
  persistence: createOPFSAdapter('demiurge-snippets.json'),
  reactivity: reactivityAdapter,
})

// Wait for all collections to be ready
export async function waitForCollectionsReady(): Promise<void> {
  await Promise.all([
    workspacesCollection.isReady(),
    tabsCollection.isReady(),
    schemasCollection.isReady(),
    appStateCollection.isReady(),
    snippetsCollection.isReady(),
  ])
}

// Re-export types
export * from './types'
