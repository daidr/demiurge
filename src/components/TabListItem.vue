<script setup lang="ts">
import type { Tab } from '@/db'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'

const { t } = useI18n()

const props = defineProps<{
  tab: Tab
  isActive: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  rename: [id: string, title: string]
  duplicate: [id: string]
}>()

const isEditing = ref(false)
const editingTitle = ref('')
const inputRef = useTemplateRef('inputRef')

function handleSelect() {
  if (!isEditing.value) {
    emit('select', props.tab.id)
  }
}

function handleDelete(e: MouseEvent) {
  e.stopPropagation()
  emit('delete', props.tab.id)
}

function startEditing() {
  isEditing.value = true
  editingTitle.value = props.tab.title
  nextTick(() => {
    inputRef.value?.ref?.focus()
    inputRef.value?.ref?.select()
  })
}

function finishEditing() {
  const newTitle = editingTitle.value.trim()
  if (newTitle && newTitle !== props.tab.title) {
    emit('rename', props.tab.id, newTitle)
  }
  isEditing.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    finishEditing()
  }
  else if (e.key === 'Escape') {
    isEditing.value = false
  }
}

function handleRename() {
  startEditing()
}

function handleDuplicate() {
  emit('duplicate', props.tab.id)
}

function handleContextDelete() {
  emit('delete', props.tab.id)
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
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
        <Input
          v-if="isEditing"
          ref="inputRef"
          v-model="editingTitle"
          size="xs"
          class="h-5 min-w-0 flex-1 px-1 py-0 text-sm"
          @blur="finishEditing"
          @keydown="handleKeydown"
          @click.stop
        />
        <span
          v-else
          class="min-w-0 flex-1 truncate"
          @dblclick.stop="startEditing"
        >
          {{ tab.title }}
        </span>
        <Button
          v-if="!isEditing"
          variant="ghost"
          size="icon"
          class="size-5 shrink-0 opacity-0 group-hover:opacity-100"
          @click="handleDelete"
        >
          <div class="i-mingcute-close-line text-sm" />
        </Button>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem @select="handleRename">
        <div class="i-mingcute-edit-2-line mr-2" />
        {{ t('tab.rename_tab') }}
      </ContextMenuItem>
      <ContextMenuItem @select="handleDuplicate">
        <div class="i-mingcute-copy-2-line mr-2" />
        {{ t('tab.duplicate_tab') }}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem class="text-destructive focus:text-destructive" @select="handleContextDelete">
        <div class="i-mingcute-delete-2-line mr-2" />
        {{ t('tab.delete_tab') }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
