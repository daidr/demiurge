import type { JsonSizeNode } from '@/components/base/JsonTree'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { getToolsWorker } from '@/utils/tools_service'

export type InteractiveTool = 'size-viewer' | 'playground'
export type PlaygroundMode = 'javascript' | 'jsonpath'
export type SizeViewerMode = 'tree' | 'treemap' | 'sunburst'

export interface PlaygroundState {
  mode: PlaygroundMode
  expression: string
  result: string | null
  error: string | null
  isExecuting: boolean
  autoRun: boolean
  executionTime: number | null
}

export const useToolsStore = defineStore('tools', () => {
  // Active interactive tool tab
  const activeTab = ref<InteractiveTool>('size-viewer')

  // JSON Size Viewer state
  const sizeTree = ref<JsonSizeNode | null>(null)
  const expandedPaths = ref<Set<string>>(new Set())
  const sizeViewerMode = ref<SizeViewerMode>('tree')
  const flattenEnabled = ref<boolean>(false)
  const isCalculating = ref<boolean>(false)

  // Sort JSON state
  const isSorting = ref<boolean>(false)

  // Playground state
  const playground = ref<PlaygroundState>({
    mode: 'javascript',
    expression: '',
    result: null,
    error: null,
    isExecuting: false,
    autoRun: false,
    executionTime: null,
  })

  // Current JSON content (will be set from workspace)
  const currentJsonContent = ref<string>('')

  // Debounce timer for content changes
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  // Debounce timer for playground auto-run
  let playgroundDebounceTimer: ReturnType<typeof setTimeout> | null = null

  function setActiveTab(tab: InteractiveTool) {
    activeTab.value = tab
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

  function setSizeViewerMode(mode: SizeViewerMode) {
    sizeViewerMode.value = mode
  }

  function setFlattenEnabled(enabled: boolean) {
    flattenEnabled.value = enabled
    recalculateSizeTree()
  }

  // Collect all paths from a tree node (for expanding all)
  // Uses same key logic as JsonTree component: empty path becomes 'root'
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

  function setPlaygroundMode(mode: PlaygroundMode) {
    playground.value.mode = mode
    playground.value.result = null
    playground.value.error = null
  }

  function setPlaygroundExpression(expr: string) {
    playground.value.expression = expr
    triggerAutoRun()
  }

  function setPlaygroundAutoRun(enabled: boolean) {
    playground.value.autoRun = enabled
    if (enabled && playground.value.expression.trim()) {
      executePlayground()
    }
  }

  function triggerAutoRun() {
    if (!playground.value.autoRun || !playground.value.expression.trim()) {
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
    currentJsonContent.value = content

    // Debounce recalculation to avoid excessive worker calls during typing
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      recalculateSizeTree()
      triggerAutoRun()
    }, 300)
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
        playground.value.expression,
        playground.value.mode,
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

  return {
    activeTab,
    sizeTree,
    expandedPaths,
    sizeViewerMode,
    flattenEnabled,
    isCalculating,
    isSorting,
    playground,
    currentJsonContent,
    setActiveTab,
    toggleSizeTreeNode,
    setSizeViewerMode,
    setFlattenEnabled,
    setPlaygroundMode,
    setPlaygroundExpression,
    setPlaygroundAutoRun,
    setCurrentJsonContent,
    executePlayground,
    sortCurrentJson,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useToolsStore, import.meta.hot))
}
