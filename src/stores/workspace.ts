import type { Tab, Workspace } from '@/db'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { uuidv7 } from 'uuidv7'
import { computed, ref, watchEffect } from 'vue'
import { useCollectionAll, useCollectionItem, useCollectionQuery } from '@/composables/useCollection'
import {
  appStateCollection,
  tabsCollection,
  workspacesCollection,
} from '@/db'

export interface CreateTabOptions {
  activeToolTab?: Tab['activeToolTab']
  sizeViewerMode?: Tab['sizeViewerMode']
  playgroundMode?: Tab['playgroundMode']
  playgroundAutoRun?: boolean
}

export const useWorkspaceStore = defineStore('workspace', () => {
  // ========== Reactive Queries ==========

  // All workspaces (sorted by createdTime)
  const workspaces = useCollectionAll<Workspace, string>(workspacesCollection, {
    sort: { createdTime: 1 },
  })

  // App state (singleton)
  const appStateItems = useCollectionQuery(
    appStateCollection,
    () => ({ id: 'singleton' as const }),
  )

  // Active workspace ID
  const activeWorkspaceId = computed(() => appStateItems.value[0]?.activeWorkspaceId ?? null)

  // Active tab ID
  const activeTabId = computed(() => appStateItems.value[0]?.activeTabId ?? null)

  // Active workspace
  const activeWorkspace = useCollectionItem<Workspace, string>(
    workspacesCollection,
    () => activeWorkspaceId.value,
  )

  // Tabs for current workspace
  const currentWorkspaceTabs = useCollectionQuery<Tab, string>(
    tabsCollection,
    () => {
      const wsId = activeWorkspaceId.value
      if (!wsId)
        return { workspaceId: '__nonexistent__' }
      return { workspaceId: wsId }
    },
  )

  // Sorted tabs (by tabOrder in workspace)
  const sortedTabs = computed(() => {
    const workspace = activeWorkspace.value
    if (!workspace)
      return []

    const order = workspace.tabOrder || []
    const tabMap = new Map(currentWorkspaceTabs.value.map(t => [t.id, t]))

    // Return tabs in order, filtering out any that don't exist
    const orderedTabs = order
      .filter(id => tabMap.has(id))
      .map(id => tabMap.get(id)!)

    // Add any tabs not in order (shouldn't happen, but safety)
    const orderedIds = new Set(order)
    const unorderedTabs = currentWorkspaceTabs.value.filter(t => !orderedIds.has(t.id))

    return [...orderedTabs, ...unorderedTabs]
  })

  // Active tab
  const activeTab = useCollectionItem<Tab, string>(
    tabsCollection,
    () => activeTabId.value,
  )

  // Has active tab
  const hasActiveTab = computed(() => activeTab.value !== null)

  // ========== Internal State ==========

  // Initialization flag
  const isInitialized = ref(false)

  // Ensure app state exists
  watchEffect(() => {
    const existing = appStateCollection.findOne({ id: 'singleton' })
    if (!existing) {
      appStateCollection.insert({
        id: 'singleton',
        activeWorkspaceId: null,
        activeTabId: null,
        sidebarOpen: true,
        sidebarFloating: false,
      })
    }
    isInitialized.value = true
  })

  // ========== Workspace Actions ==========

  function createWorkspace(title: string, icon: string = '📁'): string {
    const id = uuidv7()
    const now = Date.now()

    workspacesCollection.insert({
      id,
      title,
      icon,
      createdTime: now,
      updatedTime: now,
      tabOrder: [],
    })

    return id
  }

  function updateWorkspace(id: string, updates: Partial<Pick<Workspace, 'title' | 'icon'>>): void {
    workspacesCollection.updateOne(
      { id },
      { $set: { ...updates, updatedTime: Date.now() } },
    )
  }

  function deleteWorkspace(id: string): void {
    // Delete all tabs in this workspace
    const tabs = tabsCollection.find({ workspaceId: id }, { reactive: false }).fetch()
    for (const tab of tabs) {
      tabsCollection.removeOne({ id: tab.id })
    }

    // Delete the workspace
    workspacesCollection.removeOne({ id })

    // If deleting active workspace, clear selection
    if (activeWorkspaceId.value === id) {
      setActiveWorkspace(null)
    }
  }

  function getWorkspaceTabCount(workspaceId: string): number {
    return tabsCollection.find({ workspaceId }, { reactive: false }).fetch().length
  }

  function setActiveWorkspace(workspaceId: string | null): void {
    appStateCollection.updateOne(
      { id: 'singleton' },
      { $set: { activeWorkspaceId: workspaceId, activeTabId: null } },
    )
  }

  // ========== Tab Actions ==========

  function createTab(workspaceId: string, title: string = 'Untitled', options?: CreateTabOptions): string {
    const id = uuidv7()
    const now = Date.now()

    // Insert the tab
    tabsCollection.insert({
      id,
      workspaceId,
      title,
      createdTime: now,
      updatedTime: now,
      content: '',
      schemaId: null,
      activeToolTab: options?.activeToolTab ?? 'size-viewer',
      sizeViewerMode: options?.sizeViewerMode ?? 'tree',
      flattenEnabled: false,
      playgroundMode: options?.playgroundMode ?? 'javascript',
      playgroundExpression: '',
      playgroundAutoRun: options?.playgroundAutoRun ?? false,
    })

    // Update workspace's tabOrder
    const workspace = workspacesCollection.findOne({ id: workspaceId })
    if (workspace) {
      workspacesCollection.updateOne(
        { id: workspaceId },
        { $set: { tabOrder: [...workspace.tabOrder, id], updatedTime: now } },
      )
    }

    return id
  }

  function updateTab(tabId: string, updates: Partial<Pick<Tab, 'title'>>): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { ...updates, updatedTime: Date.now() } },
    )
  }

  function renameTab(tabId: string, title: string): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { title, updatedTime: Date.now() } },
    )
  }

  function deleteTab(tabId: string): void {
    const tab = tabsCollection.findOne({ id: tabId })
    if (!tab)
      return

    // Remove from workspace's tabOrder
    const workspace = workspacesCollection.findOne({ id: tab.workspaceId })
    if (workspace) {
      workspacesCollection.updateOne(
        { id: tab.workspaceId },
        { $set: { tabOrder: workspace.tabOrder.filter(id => id !== tabId) } },
      )
    }

    // Delete the tab
    tabsCollection.removeOne({ id: tabId })

    // If deleting active tab, clear selection
    if (activeTabId.value === tabId) {
      setActiveTab(null)
    }
  }

  function setActiveTab(tabId: string | null): void {
    appStateCollection.updateOne(
      { id: 'singleton' },
      { $set: { activeTabId: tabId } },
    )
  }

  function updateTabContent(tabId: string, content: string): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { content, updatedTime: Date.now() } },
    )
  }

  function reorderTabs(workspaceId: string, newOrder: string[]): void {
    workspacesCollection.updateOne(
      { id: workspaceId },
      { $set: { tabOrder: newOrder, updatedTime: Date.now() } },
    )
  }

  // ========== Tab Tool State Actions ==========

  function setTabActiveToolTab(tabId: string, toolTab: Tab['activeToolTab']): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { activeToolTab: toolTab } },
    )
  }

  function setTabSizeViewerMode(tabId: string, mode: Tab['sizeViewerMode']): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { sizeViewerMode: mode } },
    )
  }

  function setTabFlattenEnabled(tabId: string, enabled: boolean): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { flattenEnabled: enabled } },
    )
  }

  function setTabPlaygroundMode(tabId: string, mode: Tab['playgroundMode']): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { playgroundMode: mode } },
    )
  }

  function setTabPlaygroundExpression(tabId: string, expression: string): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { playgroundExpression: expression } },
    )
  }

  function setTabPlaygroundAutoRun(tabId: string, autoRun: boolean): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { playgroundAutoRun: autoRun } },
    )
  }

  function setTabSchemaId(tabId: string, schemaId: string | null): void {
    tabsCollection.updateOne(
      { id: tabId },
      { $set: { schemaId } },
    )
  }

  return {
    // State
    isInitialized,
    workspaces,
    activeWorkspaceId,
    activeTabId,
    activeWorkspace,
    sortedTabs,
    activeTab,
    hasActiveTab,

    // Workspace Actions
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaceTabCount,
    setActiveWorkspace,

    // Tab Actions
    createTab,
    updateTab,
    renameTab,
    deleteTab,
    setActiveTab,
    updateTabContent,
    reorderTabs,

    // Tab Tool State Actions
    setTabActiveToolTab,
    setTabSizeViewerMode,
    setTabFlattenEnabled,
    setTabPlaygroundMode,
    setTabPlaygroundExpression,
    setTabPlaygroundAutoRun,
    setTabSchemaId,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkspaceStore, import.meta.hot))
}
