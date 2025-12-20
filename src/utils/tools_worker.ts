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
  calculateSizeTree(jsonString: string, flatten: boolean): JsonSizeNode | null {
    if (!jsonString.trim()) {
      return null
    }
    try {
      let parsed = JSON.parse(jsonString)
      if (flatten) {
        parsed = flattenJson(parsed)
        console.log(parsed)
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

export type { ToolsWorker as TToolsWorker }

Comlink.expose(ToolsWorker)
