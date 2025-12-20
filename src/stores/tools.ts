import type { JsonSizeNode } from '@/components/ui/tree'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export type InteractiveTool = 'size-viewer' | 'playground'
export type PlaygroundMode = 'javascript' | 'jsonpath'
export type SizeViewerMode = 'tree' | 'treemap' | 'sunburst'

export interface PlaygroundState {
  mode: PlaygroundMode
  expression: string
  result: string | null
  error: string | null
  isExecuting: boolean
}

// TextEncoder for accurate byte size calculation
const textEncoder = new TextEncoder()

function getByteSize(str: string): number {
  return textEncoder.encode(str).length
}

export const useToolsStore = defineStore('tools', () => {
  // Active interactive tool tab
  const activeTab = ref<InteractiveTool>('size-viewer')

  // JSON Size Viewer state
  const sizeTree = ref<JsonSizeNode | null>(null)
  const expandedPaths = ref<Set<string>>(new Set())
  const sizeViewerMode = ref<SizeViewerMode>('tree')
  const flattenEnabled = ref<boolean>(false)

  // Playground state
  const playground = ref<PlaygroundState>({
    mode: 'javascript',
    expression: '',
    result: null,
    error: null,
    isExecuting: false,
  })

  // Current JSON content (will be set from workspace)
  const currentJsonContent = ref<string>('')

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
    // Recalculate size tree with new flatten setting
    recalculateSizeTree()
  }

  // Check if a value is a simple structure (primitive or array of primitives)
  function isSimpleStruct(obj: unknown): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return true
    }
    if (Array.isArray(obj)) {
      return obj.every(ele => typeof ele !== 'object' || ele === null)
    }
    return false
  }

  // Flatten JSON: merge array items by collecting same keys into arrays
  function flattenJson(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      if (isSimpleStruct(obj)) {
        return obj
      }
      const converted: Record<string, unknown[]> = {}
      const primitives: unknown[] = []
      const flatted = obj.flat()
      for (const item of flatted) {
        const processed = Array.isArray(item) ? flattenJson(item) : item
        if (processed && typeof processed === 'object' && !Array.isArray(processed)) {
          for (const k of Object.keys(processed as Record<string, unknown>)) {
            if (!converted[k]) {
              converted[k] = []
            }
            converted[k].push((processed as Record<string, unknown>)[k])
          }
        }
        else if (processed !== undefined) {
          // Collect non-object items (primitives)
          primitives.push(processed)
        }
      }
      // If we only have primitives and no object keys, return the primitives array
      if (Object.keys(converted).length === 0 && primitives.length > 0) {
        return primitives
      }
      // If we have both primitives and object keys, add primitives under a special key
      if (primitives.length > 0) {
        converted.__primitives__ = primitives
      }
      for (const k of Object.keys(converted)) {
        converted[k] = flattenJson(converted[k]) as unknown[]
      }
      return converted
    }
    else if (typeof obj === 'object' && obj !== null) {
      const converted: Record<string, unknown> = {}
      for (const k of Object.keys(obj as Record<string, unknown>)) {
        converted[k] = flattenJson((obj as Record<string, unknown>)[k])
      }
      return converted
    }
    else {
      return obj
    }
  }

  // Collect all paths from a tree node (for expanding all)
  function collectAllPaths(node: JsonSizeNode, paths: Set<string> = new Set()): Set<string> {
    if (node.children && node.children.length > 0) {
      paths.add(node.path)
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
  }

  function recalculateSizeTree() {
    const content = currentJsonContent.value
    if (!content.trim()) {
      sizeTree.value = null
      expandedPaths.value = new Set()
      return
    }
    try {
      let parsed = JSON.parse(content)
      // Apply flatten transformation if enabled
      if (flattenEnabled.value) {
        parsed = flattenJson(parsed)
      }
      const totalSize = getByteSize(JSON.stringify(parsed))
      const tree = buildSizeTree('root', '', parsed, totalSize)
      sizeTree.value = tree
      expandedPaths.value = collectAllPaths(tree)
    }
    catch {
      sizeTree.value = null
      expandedPaths.value = new Set()
    }
  }

  function setCurrentJsonContent(content: string) {
    currentJsonContent.value = content
    // Recalculate size tree when content changes
    recalculateSizeTree()
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

    try {
      const parsed = JSON.parse(content)

      if (playground.value.mode === 'javascript') {
        // Execute as JavaScript with `this` bound to JSON

        // oxlint-disable-next-line no-new-func
        const fn = new Function(`return (${playground.value.expression})`)
        const result = fn.call(parsed)
        playground.value.result = JSON.stringify(result, null, 2)
      }
      else {
        // JSONPath mode - will be implemented when jsonpath-plus is installed
        const { JSONPath } = await import('jsonpath-plus')
        const result = JSONPath({ path: playground.value.expression, json: parsed })
        playground.value.result = JSON.stringify(result, null, 2)
      }
    }
    catch (e) {
      playground.value.error = e instanceof Error ? e.message : String(e)
    }
    finally {
      playground.value.isExecuting = false
    }
  }

  function getJsonType(value: unknown): JsonSizeNode['type'] {
    if (value === null)
      return 'null'
    if (Array.isArray(value))
      return 'array'
    if (typeof value === 'object')
      return 'object'
    if (typeof value === 'string')
      return 'string'
    if (typeof value === 'number')
      return 'number'
    if (typeof value === 'boolean')
      return 'boolean'
    return 'null'
  }

  function buildSizeTree(key: string, path: string, value: unknown, totalSize: number): JsonSizeNode {
    const stringified = JSON.stringify(value)
    const size = getByteSize(stringified)
    const type = getJsonType(value)
    const percentage = totalSize > 0 ? (size / totalSize) * 100 : 0

    const node: JsonSizeNode = {
      key,
      path,
      size,
      percentage,
      type,
    }

    if (type === 'object' && value !== null) {
      const obj = value as Record<string, unknown>
      const children: JsonSizeNode[] = []
      for (const childKey of Object.keys(obj)) {
        const childPath = path ? `${path}.${childKey}` : childKey
        children.push(buildSizeTree(childKey, childPath, obj[childKey], totalSize))
      }
      // Sort children by size descending
      children.sort((a, b) => b.size - a.size)
      if (children.length > 0) {
        node.children = children
      }
    }
    else if (type === 'array') {
      const arr = value as unknown[]
      const children: JsonSizeNode[] = []
      for (let i = 0; i < arr.length; i++) {
        const childPath = path ? `${path}[${i}]` : `[${i}]`
        children.push(buildSizeTree(`[${i}]`, childPath, arr[i], totalSize))
      }
      // Sort children by size descending
      children.sort((a, b) => b.size - a.size)
      if (children.length > 0) {
        node.children = children
      }
    }

    return node
  }

  function calculateSizeTree(jsonContent: string): JsonSizeNode | null {
    if (!jsonContent.trim()) {
      return null
    }
    try {
      const parsed = JSON.parse(jsonContent)
      // Use TextEncoder for accurate byte size calculation
      // This ensures root is always 100%
      const totalSize = getByteSize(JSON.stringify(parsed))
      return buildSizeTree('root', '', parsed, totalSize)
    }
    catch {
      return null
    }
  }

  // Sort JSON keys alphabetically (recursive)
  function sortJsonKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(sortJsonKeys)
    }

    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortJsonKeys((obj as Record<string, unknown>)[key])
        return sorted
      }, {} as Record<string, unknown>)
  }

  function sortCurrentJson(): string | null {
    const content = currentJsonContent.value
    if (!content.trim()) {
      return null
    }
    try {
      const parsed = JSON.parse(content)
      const sorted = sortJsonKeys(parsed)
      return JSON.stringify(sorted, null, 2)
    }
    catch {
      return null
    }
  }

  return {
    activeTab,
    sizeTree,
    expandedPaths,
    sizeViewerMode,
    flattenEnabled,
    playground,
    currentJsonContent,
    setActiveTab,
    toggleSizeTreeNode,
    setSizeViewerMode,
    setFlattenEnabled,
    setPlaygroundMode,
    setPlaygroundExpression,
    setCurrentJsonContent,
    executePlayground,
    calculateSizeTree,
    sortCurrentJson,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useToolsStore, import.meta.hot))
}
