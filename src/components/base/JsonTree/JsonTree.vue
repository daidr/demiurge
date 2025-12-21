<script setup lang="ts">
import type { JsonSizeNode } from './types'
import { TreeItem, TreeRoot, TreeVirtualizer } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  node: JsonSizeNode
  expandedPaths: Set<string>
}>()

const emit = defineEmits<{
  toggle: [path: string]
  nodeClick: [path: string, event: MouseEvent]
}>()

// Wrap root node in array for TreeRoot items prop
const items = computed(() => [props.node])

// Convert Set to Array for TreeRoot expanded prop
const expandedArray = computed(() => Array.from(props.expandedPaths))

function getKey(item: JsonSizeNode) {
  return item.path || 'root'
}

function getChildren(item: JsonSizeNode) {
  return item.children
}

function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getTypeIcon(type: JsonSizeNode['type']): string {
  switch (type) {
    case 'object':
      return 'i-mingcute-braces-line'
    case 'array':
      return 'i-mingcute-brackets-line'
    case 'string':
      return 'i-mingcute-text-line'
    case 'number':
      return 'i-mingcute-hashtag-line'
    case 'boolean':
      return 'i-mingcute-check-line'
    case 'null':
      return 'i-mingcute-close-line'
    default:
      return 'i-mingcute-question-line'
  }
}

function hasChildren(item: JsonSizeNode): boolean {
  return !!(item.children && item.children.length > 0)
}

function handleExpandedChange(keys: string[]) {
  const currentExpanded = props.expandedPaths
  const newExpanded = new Set(keys)

  // Find added paths (newly expanded)
  for (const key of newExpanded) {
    if (!currentExpanded.has(key)) {
      emit('toggle', key)
    }
  }

  // Find removed paths (collapsed)
  for (const key of currentExpanded) {
    if (!newExpanded.has(key)) {
      emit('toggle', key)
    }
  }
}

function handleNodeClick(node: JsonSizeNode, event: MouseEvent) {
  emit('nodeClick', node.path, event)
}

// Capture phase handler to intercept alt+click before TreeItem handles it
function handleClickCapture(node: JsonSizeNode, event: MouseEvent) {
  if (event.altKey) {
    event.stopPropagation()
    event.preventDefault()
    emit('nodeClick', node.path, event)
  }
}
</script>

<template>
  <TreeRoot
    :items="items"
    :get-key="getKey"
    :get-children="getChildren"
    :expanded="expandedArray"
    class="text-sm select-none h-full overflow-y-auto"
    @update:expanded="handleExpandedChange"
  >
    <TreeVirtualizer
      v-slot="{ item }"
      :estimate-size="28"
      :text-content="(opt) => opt.key"
      class="h-full overflow-auto"
    >
      <TreeItem
        v-slot="{ isExpanded }"
        v-bind="item.bind"
        :style="{ paddingLeft: `${item.level * 16 + 8}px` }"
        :class="cn(
          'flex w-full items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer outline-none',
          'focus:bg-accent',
          hasChildren(item.value as JsonSizeNode) && 'font-medium',
        )"
        @click.capture="handleClickCapture(item.value as JsonSizeNode, $event)"
        @click="handleNodeClick(item.value as JsonSizeNode, $event)"
      >
        <!-- Expand/collapse icon -->
        <span v-if="hasChildren(item.value as JsonSizeNode)" class="w-4 flex-shrink-0">
          <span
            :class="isExpanded ? 'i-mingcute-down-line' : 'i-mingcute-right-line'"
            class="block text-xs"
          />
        </span>
        <span v-else class="w-4 flex-shrink-0" />

        <!-- Type icon -->
        <span :class="cn('w-4 flex-shrink-0 text-muted-foreground', getTypeIcon(item.value.type))" />

        <!-- Key name -->
        <span class="flex-grow truncate">{{ item.value.key }}</span>

        <!-- Size info -->
        <span class="text-muted-foreground text-xs whitespace-nowrap">
          {{ formatSize(item.value.size) }}
          <span class="ml-1">({{ item.value.percentage.toFixed(1) }}%)</span>
        </span>

        <!-- Size bar -->
        <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white">
          <div
            class="h-full bg-primary transition-all"
            :style="{ width: `${Math.max(item.value.percentage, 1)}%` }"
          />
        </div>
      </TreeItem>
    </TreeVirtualizer>
  </TreeRoot>
</template>
