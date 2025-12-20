<script setup lang="ts">
import type { JsonSizeNode } from './types'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  node: JsonSizeNode
  depth?: number
  expandedPaths: Set<string>
}>()

const emit = defineEmits<{
  toggle: [path: string]
}>()

const depth = computed(() => props.depth ?? 0)
const hasChildren = computed(() =>
  props.node.children && props.node.children.length > 0,
)
const isExpanded = computed(() => props.expandedPaths.has(props.node.path))
const paddingLeft = computed(() => `${depth.value * 16 + 8}px`)

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

function handleClick() {
  if (hasChildren.value) {
    emit('toggle', props.node.path)
  }
}

function handleToggle(path: string) {
  emit('toggle', path)
}
</script>

<template>
  <div role="treeitem" :aria-expanded="hasChildren ? isExpanded : undefined">
    <div
      :class="cn(
        'flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer',
        hasChildren && 'font-medium',
      )"
      :style="{ paddingLeft }"
      @click="handleClick"
    >
      <!-- Expand/collapse icon -->
      <span v-if="hasChildren" class="w-4 flex-shrink-0">
        <span
          :class="isExpanded ? 'i-mingcute-down-line' : 'i-mingcute-right-line'"
          class="block text-xs"
        />
      </span>
      <span v-else class="w-4 flex-shrink-0" />

      <!-- Type icon -->
      <span :class="cn('w-4 flex-shrink-0 text-muted-foreground', getTypeIcon(node.type))" />

      <!-- Key name -->
      <span class="flex-grow truncate">{{ node.key }}</span>

      <!-- Size info -->
      <span class="text-muted-foreground text-xs whitespace-nowrap">
        {{ formatSize(node.size) }}
        <span class="ml-1">({{ node.percentage.toFixed(1) }}%)</span>
      </span>

      <!-- Size bar -->
      <div class="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
        <div
          class="h-full bg-primary transition-all"
          :style="{ width: `${Math.max(node.percentage, 1)}%` }"
        />
      </div>
    </div>

    <!-- Children (recursive) -->
    <template v-if="hasChildren && isExpanded">
      <TreeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :expanded-paths="expandedPaths"
        @toggle="handleToggle"
      />
    </template>
  </div>
</template>
