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
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

const icon = ref(randomEmoji())
const title = ref('')

// Reset form when dialog opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    icon.value = randomEmoji()
    title.value = ''
  }
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

function handleCreate() {
  if (!title.value.trim())
    return

  const id = workspaceStore.createWorkspace(title.value.trim(), icon.value)
  workspaceStore.setActiveWorkspace(id)
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
        <DialogTitle>{{ t('workspace.create_workspace') }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="ws-icon" class="text-right">{{ t('workspace.icon') }}</Label>
          <div class="col-span-3 flex gap-2">
            <Input
              id="ws-icon"
              v-model="icon"
              type="text"
              class="flex-1"
            />
            <Button size="sm" variant="outline" type="button" @click="refreshEmoji">
              <span class="i-mingcute-refresh-2-line" />
            </Button>
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="ws-title" class="text-right">{{ t('workspace.title') }}</Label>
          <Input
            id="ws-title"
            v-model="title"
            type="text"
            :placeholder="t('workspace.title_placeholder')"
            class="col-span-3"
            @keydown.enter="handleCreate"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleOpenChange(false)">
          {{ t('common.cancel') }}
        </Button>
        <Button :disabled="!title.trim()" @click="handleCreate">
          {{ t('common.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
