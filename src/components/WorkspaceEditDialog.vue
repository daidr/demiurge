<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspaceStore } from '@/stores/workspace'
import { randomEmoji } from '@/utils/emoji'

const props = defineProps<{
  open: boolean
  workspaceId: string | null
  initialIcon: string
  initialTitle: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

const icon = ref('')
const title = ref('')

// Reset form when dialog opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    icon.value = props.initialIcon
    title.value = props.initialTitle
  }
})

// Limit icon to single character (grapheme)
function handleIconInput(e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value
  // Use Intl.Segmenter to properly handle emoji and other grapheme clusters
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
  const segments = [...segmenter.segment(value)]
  if (segments.length > 1) {
    // Keep only the last grapheme (the newly typed one)
    icon.value = segments[segments.length - 1].segment
  }
  else {
    icon.value = value
  }
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

function handleSave() {
  if (!title.value.trim() || !props.workspaceId)
    return

  workspaceStore.updateWorkspace(props.workspaceId, {
    title: title.value.trim(),
    icon: icon.value,
  })
  emit('update:open', false)
}

function refreshEmoji() {
  icon.value = randomEmoji()
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.edit_workspace') }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="ws-edit-icon" class="text-right">{{ t('workspace.icon') }}</Label>
          <div class="col-span-3 flex gap-2">
            <Input
              id="ws-edit-icon"
              :model-value="icon"
              type="text"
              class="flex-1 text-center text-lg"
              @input="handleIconInput"
            />
            <Button size="sm" variant="outline" type="button" @click="refreshEmoji">
              <span class="i-mingcute-refresh-2-line" />
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="ws-edit-title" class="text-right">{{ t('workspace.title') }}</Label>
          <Input
            id="ws-edit-title"
            v-model="title"
            type="text"
            :placeholder="t('workspace.title_placeholder')"
            class="col-span-3"
            @keydown.enter="handleSave"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleOpenChange(false)">
          {{ t('common.cancel') }}
        </Button>
        <Button :disabled="!title.trim()" @click="handleSave">
          {{ t('common.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
