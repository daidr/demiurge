import type { editor } from 'monaco-editor'
import type { JsonSizeNode } from '@/components/base/JsonTree'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { schemasCollection } from '@/db'
import { findJsonPathPosition } from '@/utils/jsonPathToPosition'
import { getToolsWorker } from '@/utils/tools_service'
import { useWorkspaceStore } from './workspace'

// Re-export types from db for convenience
export type { InteractiveTool, PlaygroundMode, SizeViewerMode } from '@/db'

export interface PlaygroundState {
  result: string | null
  error: string | null
  isExecuting: boolean
  executionTime: number | null
}

export const useToolsStore = defineStore('tools', () => {
  const workspaceStore = useWorkspaceStore()
  const { activeTab: activeTabData, activeTabId } = storeToRefs(workspaceStore)

  // ========== Computed from Tab (persisted state) ==========

  // Active tool tab
  const activeToolTab = computed(() => activeTabData.value?.activeToolTab ?? 'size-viewer')

  // Size Viewer mode
  const sizeViewerMode = computed(() => activeTabData.value?.sizeViewerMode ?? 'tree')

  // Flatten enabled
  const flattenEnabled = computed(() => activeTabData.value?.flattenEnabled ?? false)

  // Playground mode
  const playgroundMode = computed(() => activeTabData.value?.playgroundMode ?? 'javascript')

  // Playground expression
  const playgroundExpression = computed(() => activeTabData.value?.playgroundExpression ?? '')

  // Playground auto-run
  const playgroundAutoRun = computed(() => activeTabData.value?.playgroundAutoRun ?? false)

  // Current JSON content
  const currentJsonContent = computed(() => activeTabData.value?.content ?? '')

  // Current schema ID
  const currentSchemaId = computed(() => activeTabData.value?.schemaId ?? null)

  // Current JSON schema content (from schema collection)
  const currentJsonSchema = computed(() => {
    const schemaId = currentSchemaId.value
    if (!schemaId)
      return ''
    const schema = schemasCollection.findOne({ id: schemaId })
    return schema?.content ?? ''
  })

  // ========== Runtime State (not persisted) ==========

  // JSON Size Viewer runtime state
  const sizeTree = ref<JsonSizeNode | null>(null)
  const expandedPaths = ref<Set<string>>(new Set())
  const isCalculating = ref<boolean>(false)

  // Sort JSON state
  const isSorting = ref<boolean>(false)

  // Playground runtime state
  const playground = ref<PlaygroundState>({
    result: null,
    error: null,
    isExecuting: false,
    executionTime: null,
  })

  // Editor reference (set by LayoutJsonEditor)
  const editorRef = shallowRef<editor.IStandaloneCodeEditor | null>(null)

  // Debounce timer for content changes
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  // Debounce timer for playground auto-run
  let playgroundDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // ========== Watchers for recalculation ==========

  // Watch for tab changes to reset runtime state
  watch(activeTabId, () => {
    sizeTree.value = null
    expandedPaths.value = new Set()
    playground.value = {
      result: null,
      error: null,
      isExecuting: false,
      executionTime: null,
    }
    // Recalculate size tree when tab changes
    if (activeTabData.value?.content) {
      recalculateSizeTree()
    }
  })

  // Watch for content changes (immediate: true ensures initial calculation from store)
  watch(currentJsonContent, (newContent) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    // For initial load with existing content, calculate immediately
    if (newContent && !sizeTree.value) {
      recalculateSizeTree()
      return
    }
    // For subsequent changes, debounce
    debounceTimer = setTimeout(() => {
      recalculateSizeTree()
      triggerAutoRun()
    }, 300)
  }, { immediate: true })

  // Watch for flatten changes
  watch(flattenEnabled, () => {
    recalculateSizeTree()
  })

  // ========== Actions ==========

  function setActiveToolTab(tab: 'size-viewer' | 'playground') {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabActiveToolTab(tabId, tab)
  }

  function toggleSizeTreeNode(path: string) {
    const newPaths = new Set(expandedPaths.value)
    if (newPaths.has(path)) {
      newPaths.delete(path)
    }
    else {
      newPaths.add(path)
    }
    expandedPaths.value = newPaths
  }

  function setSizeViewerMode(mode: 'tree' | 'sunburst') {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabSizeViewerMode(tabId, mode)
  }

  function setFlattenEnabled(enabled: boolean) {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabFlattenEnabled(tabId, enabled)
  }

  // Collect all paths from a tree node (for expanding all)
  function collectAllPaths(node: JsonSizeNode, paths: Set<string> = new Set()): Set<string> {
    if (node.children && node.children.length > 0) {
      const key = node.path || 'root'
      paths.add(key)
      for (const child of node.children) {
        collectAllPaths(child, paths)
      }
    }
    return paths
  }

  function setPlaygroundMode(mode: 'javascript' | 'jsonpath') {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabPlaygroundMode(tabId, mode)
    playground.value.result = null
    playground.value.error = null
  }

  function setPlaygroundExpression(expr: string) {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabPlaygroundExpression(tabId, expr)
    triggerAutoRun()
  }

  function setPlaygroundAutoRun(enabled: boolean) {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabPlaygroundAutoRun(tabId, enabled)
    if (enabled && playgroundExpression.value.trim()) {
      executePlayground()
    }
  }

  function triggerAutoRun() {
    if (!playgroundAutoRun.value || !playgroundExpression.value.trim()) {
      return
    }

    if (playgroundDebounceTimer) {
      clearTimeout(playgroundDebounceTimer)
    }
    playgroundDebounceTimer = setTimeout(() => {
      executePlayground()
    }, 300)
  }

  async function recalculateSizeTree() {
    const content = currentJsonContent.value
    if (!content.trim()) {
      sizeTree.value = null
      expandedPaths.value = new Set()
      return
    }

    isCalculating.value = true
    try {
      const worker = await getToolsWorker()
      const tree = await worker.calculateSizeTree(content, flattenEnabled.value)
      sizeTree.value = tree
      if (tree) {
        expandedPaths.value = collectAllPaths(tree)
      }
      else {
        expandedPaths.value = new Set()
      }
    }
    catch {
      sizeTree.value = null
      expandedPaths.value = new Set()
    }
    finally {
      isCalculating.value = false
    }
  }

  function setCurrentJsonContent(content: string) {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.updateTabContent(tabId, content)
  }

  async function executePlayground() {
    const content = currentJsonContent.value
    if (!content) {
      playground.value.error = 'No JSON content available'
      return
    }

    playground.value.isExecuting = true
    playground.value.error = null
    playground.value.result = null
    playground.value.executionTime = null

    const startTime = performance.now()

    try {
      const worker = await getToolsWorker()
      const { result, error } = await worker.executePlayground(
        content,
        playgroundExpression.value,
        playgroundMode.value,
      )
      playground.value.result = result
      playground.value.error = error
    }
    catch (e) {
      playground.value.error = e instanceof Error ? e.message : String(e)
    }
    finally {
      playground.value.executionTime = performance.now() - startTime
      playground.value.isExecuting = false
    }
  }

  async function sortCurrentJson(): Promise<string | null> {
    const content = currentJsonContent.value
    if (!content.trim()) {
      return null
    }

    isSorting.value = true
    try {
      const worker = await getToolsWorker()
      const result = await worker.sortJson(content)
      return result
    }
    catch {
      return null
    }
    finally {
      isSorting.value = false
    }
  }

  function setTabSchemaId(schemaId: string | null) {
    const tabId = activeTabId.value
    if (!tabId)
      return
    workspaceStore.setTabSchemaId(tabId, schemaId)
  }

  function setEditorRef(editor: editor.IStandaloneCodeEditor | null) {
    editorRef.value = editor
  }

  function navigateToJsonPath(path: string) {
    if (!editorRef.value)
      return

    const content = currentJsonContent.value
    const position = findJsonPathPosition(content, path)
    if (position) {
      editorRef.value.revealLineInCenter(position.line)
      editorRef.value.setSelection({
        startLineNumber: position.line,
        startColumn: position.column,
        endLineNumber: position.endLine,
        endColumn: position.endColumn,
      })
      editorRef.value.focus()
    }
  }

  return {
    // Computed from Tab (persisted)
    activeToolTab,
    sizeViewerMode,
    flattenEnabled,
    playgroundMode,
    playgroundExpression,
    playgroundAutoRun,
    currentJsonContent,
    currentSchemaId,
    currentJsonSchema,

    // Runtime state (not persisted)
    sizeTree,
    expandedPaths,
    isCalculating,
    isSorting,
    playground,

    // Actions
    setActiveToolTab,
    toggleSizeTreeNode,
    setSizeViewerMode,
    setFlattenEnabled,
    setPlaygroundMode,
    setPlaygroundExpression,
    setPlaygroundAutoRun,
    setCurrentJsonContent,
    setTabSchemaId,
    setEditorRef,
    navigateToJsonPath,
    executePlayground,
    sortCurrentJson,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useToolsStore, import.meta.hot))
}
