<script setup lang="ts">
import type { Tab } from '@/db'
import { ref } from 'vue'
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

// Drag state
const draggedId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

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

  // Remove dragged item and insert at target position
  const newOrder = [...currentOrder]
  newOrder.splice(draggedIndex, 1)
  newOrder.splice(targetIndex, 0, draggedId.value)

  emit('reorder', newOrder)

  draggedId.value = null
  dragOverId.value = null
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      draggable="true"
      class="relative"
      :class="{
        'opacity-50': draggedId === tab.id,
      }"
      @dragstart="handleDragStart($event, tab.id)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver($event, tab.id)"
      @dragleave="handleDragLeave"
      @drop="handleDrop($event, tab.id)"
    >
      <!-- Drop indicator -->
      <div
        v-if="dragOverId === tab.id && draggedId !== tab.id"
        class="bg-primary absolute inset-x-0 top-0 h-0.5"
      />
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
