import type { JsonSizeNode } from '@/components/base/JsonTree/types'
import * as Comlink from 'comlink'

// TextEncoder for accurate byte size calculation
const textEncoder = new TextEncoder()

function getByteSize(str: string): number {
  return textEncoder.encode(str).length
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
        primitives.push(processed)
      }
    }
    if (Object.keys(converted).length === 0 && primitives.length > 0) {
      return primitives
    }
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
    children.sort((a, b) => b.size - a.size)
    if (children.length > 0) {
      node.children = children
    }
  }

  return node
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

class ToolsWorker {
  calculateTypeStatistics(jsonString: string): TypeStatistics | null {
    if (!jsonString.trim()) {
      return null
    }
    try {
      const parsed = JSON.parse(jsonString)
      return calculateTypeStatistics(parsed)
    }
    catch {
      return null
    }
  }

  calculateSizeTree(jsonString: string, flatten: boolean): JsonSizeNode | null {
    if (!jsonString.trim()) {
      return null
    }
    try {
      let parsed = JSON.parse(jsonString)
      if (flatten) {
        parsed = flattenJson(parsed)
      }
      const totalSize = getByteSize(JSON.stringify(parsed))
      return buildSizeTree('root', '', parsed, totalSize)
    }
    catch {
      return null
    }
  }

  sortJson(jsonString: string): string | null {
    if (!jsonString.trim()) {
      return null
    }
    try {
      const parsed = JSON.parse(jsonString)
      const sorted = sortJsonKeys(parsed)
      return JSON.stringify(sorted, null, 2)
    }
    catch {
      return null
    }
  }

  calculateJsonDiff(leftJson: string, rightJson: string): DiffResult | null {
    return calculateJsonDiff(leftJson, rightJson)
  }

  async executePlayground(
    jsonString: string,
    expression: string,
    mode: 'javascript' | 'jsonpath',
  ): Promise<{ result: string | null, error: string | null }> {
    if (!jsonString) {
      return { result: null, error: 'No JSON content available' }
    }

    try {
      const parsed = JSON.parse(jsonString)

      if (mode === 'javascript') {
        // Execute as JavaScript with $ and data as JSON aliases
        // Using strict mode ensures `this` is undefined inside the expression

        // oxlint-disable-next-line no-new-func
        const fn = new Function('$', 'data', `"use strict"; return (${expression})`)
        const result = fn(parsed, parsed)
        return { result: JSON.stringify(result, null, 2), error: null }
      }
      else {
        // JSONPath mode
        const { JSONPath } = await import('jsonpath-plus')
        const result = JSONPath({ path: expression, json: parsed })
        return { result: JSON.stringify(result, null, 2), error: null }
      }
    }
    catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) }
    }
  }
}

// Type Statistics types and calculation
export interface TypeStatistics {
  totalNodes: number
  maxDepth: number
  types: {
    object: number
    array: number
    string: number
    number: number
    boolean: number
    null: number
  }
  keys: {
    total: number
    unique: number
    duplicates: Map<string, number> | Record<string, number>
  }
  arrays: {
    count: number
    totalElements: number
    maxLength: number
    avgLength: number
  }
  strings: {
    count: number
    totalLength: number
    maxLength: number
    avgLength: number
    emptyCount: number
  }
  numbers: {
    count: number
    min: number | null
    max: number | null
    hasFloat: boolean
    hasNegative: boolean
  }
}

function calculateTypeStatistics(value: unknown): TypeStatistics {
  const stats: TypeStatistics = {
    totalNodes: 0,
    maxDepth: 0,
    types: {
      object: 0,
      array: 0,
      string: 0,
      number: 0,
      boolean: 0,
      null: 0,
    },
    keys: {
      total: 0,
      unique: 0,
      duplicates: {},
    },
    arrays: {
      count: 0,
      totalElements: 0,
      maxLength: 0,
      avgLength: 0,
    },
    strings: {
      count: 0,
      totalLength: 0,
      maxLength: 0,
      avgLength: 0,
      emptyCount: 0,
    },
    numbers: {
      count: 0,
      min: null,
      max: null,
      hasFloat: false,
      hasNegative: false,
    },
  }

  const keyCount: Record<string, number> = {}

  function traverse(val: unknown, depth: number): void {
    stats.totalNodes++
    stats.maxDepth = Math.max(stats.maxDepth, depth)

    if (val === null) {
      stats.types.null++
      return
    }

    if (Array.isArray(val)) {
      stats.types.array++
      stats.arrays.count++
      stats.arrays.totalElements += val.length
      stats.arrays.maxLength = Math.max(stats.arrays.maxLength, val.length)

      for (const item of val) {
        traverse(item, depth + 1)
      }
      return
    }

    if (typeof val === 'object') {
      stats.types.object++
      const keys = Object.keys(val as Record<string, unknown>)
      stats.keys.total += keys.length

      for (const key of keys) {
        keyCount[key] = (keyCount[key] || 0) + 1
        traverse((val as Record<string, unknown>)[key], depth + 1)
      }
      return
    }

    if (typeof val === 'string') {
      stats.types.string++
      stats.strings.count++
      stats.strings.totalLength += val.length
      stats.strings.maxLength = Math.max(stats.strings.maxLength, val.length)
      if (val.length === 0) {
        stats.strings.emptyCount++
      }
      return
    }

    if (typeof val === 'number') {
      stats.types.number++
      stats.numbers.count++
      if (stats.numbers.min === null || val < stats.numbers.min) {
        stats.numbers.min = val
      }
      if (stats.numbers.max === null || val > stats.numbers.max) {
        stats.numbers.max = val
      }
      if (!Number.isInteger(val)) {
        stats.numbers.hasFloat = true
      }
      if (val < 0) {
        stats.numbers.hasNegative = true
      }
      return
    }

    if (typeof val === 'boolean') {
      stats.types.boolean++
    }
  }

  traverse(value, 0)

  // Calculate averages and key statistics
  if (stats.arrays.count > 0) {
    stats.arrays.avgLength = stats.arrays.totalElements / stats.arrays.count
  }
  if (stats.strings.count > 0) {
    stats.strings.avgLength = stats.strings.totalLength / stats.strings.count
  }

  stats.keys.unique = Object.keys(keyCount).length
  const duplicates: Record<string, number> = {}
  for (const [key, count] of Object.entries(keyCount)) {
    if (count > 1) {
      duplicates[key] = count
    }
  }
  stats.keys.duplicates = duplicates

  return stats
}

// JSON Diff types and calculation
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'type_changed'

export interface DiffChange {
  /** The type of change */
  type: DiffChangeType
  /** JSONPath to the changed value (e.g., "$.users[0].name") */
  path: string
  /** Old value (for removed/modified) */
  oldValue?: unknown
  /** New value (for added/modified) */
  newValue?: unknown
  /** Old type (for type_changed) */
  oldType?: string
  /** New type (for type_changed) */
  newType?: string
}

export interface DiffResult {
  /** List of all changes */
  changes: DiffChange[]
  /** Statistics */
  stats: {
    added: number
    removed: number
    modified: number
    typeChanged: number
    total: number
  }
}

function getValueType(value: unknown): string {
  if (value === null)
    return 'null'
  if (Array.isArray(value))
    return 'array'
  return typeof value
}

function buildJsonPath(segments: (string | number)[]): string {
  if (segments.length === 0)
    return '$'
  let result = '$'
  for (const seg of segments) {
    if (typeof seg === 'number') {
      result += `[${seg}]`
    }
    else if (/^[a-z_$][\w$]*$/i.test(seg)) {
      result += `.${seg}`
    }
    else {
      result += `["${seg.replace(/"/g, '\\"')}"]`
    }
  }
  return result
}

function calculateJsonDiffInternal(
  oldVal: unknown,
  newVal: unknown,
  pathSegments: (string | number)[],
  changes: DiffChange[],
): void {
  const oldType = getValueType(oldVal)
  const newType = getValueType(newVal)
  const path = buildJsonPath(pathSegments)

  // Both undefined - no change
  if (oldVal === undefined && newVal === undefined) {
    return
  }

  // Added
  if (oldVal === undefined && newVal !== undefined) {
    changes.push({
      type: 'added',
      path,
      newValue: newVal,
    })
    return
  }

  // Removed
  if (oldVal !== undefined && newVal === undefined) {
    changes.push({
      type: 'removed',
      path,
      oldValue: oldVal,
    })
    return
  }

  // Type changed
  if (oldType !== newType) {
    changes.push({
      type: 'type_changed',
      path,
      oldValue: oldVal,
      newValue: newVal,
      oldType,
      newType,
    })
    return
  }

  // Both are arrays
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const maxLen = Math.max(oldVal.length, newVal.length)
    for (let i = 0; i < maxLen; i++) {
      calculateJsonDiffInternal(
        oldVal[i],
        newVal[i],
        [...pathSegments, i],
        changes,
      )
    }
    return
  }

  // Both are objects
  if (oldType === 'object' && newType === 'object' && oldVal !== null && newVal !== null) {
    const oldObj = oldVal as Record<string, unknown>
    const newObj = newVal as Record<string, unknown>
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      calculateJsonDiffInternal(
        oldObj[key],
        newObj[key],
        [...pathSegments, key],
        changes,
      )
    }
    return
  }

  // Primitives - check if modified
  if (oldVal !== newVal) {
    changes.push({
      type: 'modified',
      path,
      oldValue: oldVal,
      newValue: newVal,
    })
  }
}

function calculateJsonDiff(leftJson: string, rightJson: string): DiffResult | null {
  try {
    const leftParsed = JSON.parse(leftJson)
    const rightParsed = JSON.parse(rightJson)

    const changes: DiffChange[] = []
    calculateJsonDiffInternal(leftParsed, rightParsed, [], changes)

    // Sort changes: removed first, then modified, then added
    const typeOrder: Record<DiffChangeType, number> = {
      removed: 0,
      type_changed: 1,
      modified: 2,
      added: 3,
    }
    changes.sort((a, b) => {
      const orderDiff = typeOrder[a.type] - typeOrder[b.type]
      if (orderDiff !== 0)
        return orderDiff
      return a.path.localeCompare(b.path)
    })

    const stats = {
      added: changes.filter(c => c.type === 'added').length,
      removed: changes.filter(c => c.type === 'removed').length,
      modified: changes.filter(c => c.type === 'modified').length,
      typeChanged: changes.filter(c => c.type === 'type_changed').length,
      total: changes.length,
    }

    return { changes, stats }
  }
  catch {
    return null
  }
}

export type { ToolsWorker as TToolsWorker }

Comlink.expose(ToolsWorker)
