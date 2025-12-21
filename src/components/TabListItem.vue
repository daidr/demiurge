<script setup lang="ts">
import type { Tab } from '@/db'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  tab: Tab
  isActive: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()

function handleSelect() {
  emit('select', props.tab.id)
}

function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  emit('delete', props.tab.id)
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
    :class="[
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'hover:bg-accent/50',
    ]"
    @click="handleSelect"
  >
    <div class="i-mingcute-file-line text-muted-foreground shrink-0" />
    <span class="min-w-0 flex-1 truncate">{{ tab.title }}</span>
    <Button
      variant="ghost"
      size="icon"
      class="size-5 shrink-0 opacity-0 group-hover:opacity-100"
      @click="handleDelete"
    >
      <div class="i-mingcute-close-line text-sm" />
    </Button>
  </div>
</template>
