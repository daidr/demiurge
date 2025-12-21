<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspaceStore } from '@/stores/workspace'
import { randomEmoji } from '@/utils/emoji'

const props = defineProps<{
  initialInfo?: {
    icon: string
    title: string
  }
}>()

const emit = defineEmits<{
  created: [id: string]
  close: []
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

const icon = ref(props.initialInfo?.icon ?? randomEmoji())
const title = ref(props.initialInfo?.title ?? '')

function handleCreate() {
  if (!title.value.trim())
    return

  const id = workspaceStore.createWorkspace(title.value.trim(), icon.value)
  workspaceStore.setActiveWorkspace(id)
  emit('created', id)
  emit('close')

  // Reset form
  icon.value = randomEmoji()
  title.value = ''
}

function refreshEmoji() {
  icon.value = randomEmoji()
}
</script>

<template>
  <div class="grid gap-4">
    <div class="space-y-2">
      <h4 class="font-medium leading-none">
        {{ initialInfo ? t('workspace.edit_workspace') : t('workspace.create_workspace') }}
      </h4>
    </div>
    <div class="grid gap-2">
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="icon">{{ t("workspace.icon") }}</Label>
        <div class="col-span-2 flex gap-1">
          <Input
            id="icon"
            v-model="icon"
            type="text"
            class="h-8 flex-1"
          />
          <Button size="xs" variant="outline" type="button" @click="refreshEmoji">
            <span class="i-mingcute-refresh-2-line" />
          </Button>
        </div>
      </div>
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="title">{{ t("workspace.title") }}</Label>
        <Input
          id="title"
          v-model="title"
          type="text"
          :placeholder="t('workspace.title_placeholder')"
          class="col-span-2 h-8"
          @keydown.enter="handleCreate"
        />
      </div>
      <div class="grid grid-cols-3 content-end gap-4">
        <Button
          size="xs"
          class="col-start-3"
          :disabled="!title.trim()"
          @click="handleCreate"
        >
          {{ t('common.create') }}
        </Button>
      </div>
    </div>
  </div>
</template>
