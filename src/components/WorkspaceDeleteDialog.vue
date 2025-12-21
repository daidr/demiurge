<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'

const props = defineProps<{
  open: boolean
  workspaceId: string | null
  workspaceTitle: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()

// Check if workspace has tabs (for second confirmation)
const tabCount = ref(0)
const showSecondConfirm = ref(false)

// Watch both open and workspaceId to refresh tab count
watch([() => props.open, () => props.workspaceId], ([isOpen, id]) => {
  if (isOpen && id) {
    tabCount.value = workspaceStore.getWorkspaceTabCount(id)
    showSecondConfirm.value = false
  }
}, { immediate: true })

const hasTabsWarning = computed(() => tabCount.value > 0 && !showSecondConfirm.value)

function handleOpenChange(value: boolean) {
  if (!value) {
    showSecondConfirm.value = false
  }
  emit('update:open', value)
}

function handleConfirm() {
  if (hasTabsWarning.value) {
    // Show second confirmation
    showSecondConfirm.value = true
    return
  }

  // Actually delete
  if (props.workspaceId) {
    workspaceStore.deleteWorkspace(props.workspaceId)
  }
  emit('update:open', false)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="handleOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t('workspace.delete_workspace') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <template v-if="showSecondConfirm">
            {{ t('workspace.delete_confirm_with_tabs', { title: workspaceTitle, count: tabCount }) }}
          </template>
          <template v-else-if="hasTabsWarning">
            {{ t('workspace.delete_warning_has_tabs', { title: workspaceTitle, count: tabCount }) }}
          </template>
          <template v-else>
            {{ t('workspace.delete_confirm', { title: workspaceTitle }) }}
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <Button
          variant="destructive"
          @click="handleConfirm"
        >
          {{ showSecondConfirm ? t('workspace.confirm_delete') : t('common.delete') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
