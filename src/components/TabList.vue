<script setup lang="ts">
import type { Tab } from '@/db'
import { ref, watchEffect } from 'vue'
import TabListItem from './TabListItem.vue'

const props = defineProps<{
  tabs: Tab[]
  activeTabId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  rename: [id: string, title: string]
  duplicate: [id: string]
  reorder: [newOrder: string[]]
}>()

// Container ref for DOM-based class updates
const containerRef = ref<HTMLDivElement | null>(null)

// Drag state - using raw values to avoid triggering Vue re-renders
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

// Use watchEffect to directly update DOM classes instead of reactive bindings
// This avoids re-rendering all tab items when drag state changes
watchEffect(() => {
  if (!containerRef.value)
    return

  const items = containerRef.value.querySelectorAll('[data-tab-id]')
  items.forEach((el) => {
    const tabId = el.getAttribute('data-tab-id')
    // Update dragging state
    el.classList.toggle('is-dragging', tabId === draggedId.value)
    // Update drag-over state
    el.classList.toggle('drag-over', tabId === dragOverId.value && tabId !== draggedId.value)
  })
})

function handleSelect(id: string) {
  emit('select', id)
}

function handleDelete(id: string) {
  emit('delete', id)
}

function handleRename(id: string, title: string) {
  emit('rename', id, title)
}

function handleDuplicate(id: string) {
  emit('duplicate', id)
}

function handleDragStart(e: DragEvent, tabId: string) {
  // Prevent drag when interacting with input elements (allow text selection)
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    e.preventDefault()
    return
  }

  draggedId.value = tabId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tabId)
    // Mark as internal drag for sidebar to ignore
    e.dataTransfer.setData('application/x-demiurge-tab', tabId)
  }
}

function handleDragEnd() {
  draggedId.value = null
  dragOverId.value = null
}

function handleDragOver(e: DragEvent, tabId: string) {
  e.preventDefault()
  if (draggedId.value && draggedId.value !== tabId) {
    dragOverId.value = tabId
  }
}

function handleDragLeave() {
  dragOverId.value = null
}

function handleDrop(e: DragEvent, targetId: string) {
  e.preventDefault()

  if (!draggedId.value || draggedId.value === targetId) {
    draggedId.value = null
    dragOverId.value = null
    return
  }

  // Calculate new order
  const currentOrder = props.tabs.map(t => t.id)
  const draggedIndex = currentOrder.indexOf(draggedId.value)
  const targetIndex = currentOrder.indexOf(targetId)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedId.value = null
    dragOverId.value = null
    return
  }

  // Remove dragged item and insert after target
  const newOrder = [...currentOrder]
  newOrder.splice(draggedIndex, 1)
  // Insert after target (adjust index if dragged was before target)
  const insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1
  newOrder.splice(insertIndex, 0, draggedId.value)

  emit('reorder', newOrder)

  draggedId.value = null
  dragOverId.value = null
}
</script>

<template>
  <div ref="containerRef" class="flex flex-col gap-0.5">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :data-tab-id="tab.id"
      draggable="true"
      class="tab-drag-item relative"
      @dragstart="handleDragStart($event, tab.id)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver($event, tab.id)"
      @dragleave="handleDragLeave"
      @drop="handleDrop($event, tab.id)"
    >
      <!-- Drop indicator - controlled via CSS -->
      <div class="drop-indicator" />
      <TabListItem
        :tab="tab"
        :is-active="activeTabId === tab.id"
        @select="handleSelect"
        @delete="handleDelete"
        @rename="handleRename"
        @duplicate="handleDuplicate"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-drag-item {
  transition: opacity 0.1s ease;
}

.tab-drag-item.is-dragging {
  opacity: 0.5;
}

.drop-indicator {
  display: none;
  position: absolute;
  inset-inline: 0;
  bottom: -1px;
  height: 2px;
  background-color: hsl(var(--primary));
  pointer-events: none;
}

.tab-drag-item.drag-over .drop-indicator {
  display: block;
}
</style>
