<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLayoutStore } from '@/stores/layout'
import { useWorkspaceStore } from '@/stores/workspace'
import BaseTooltip from './BaseTooltip.vue'
import TabList from './TabList.vue'
import { Button } from './ui/button'
import WorkspaceDeleteDialog from './WorkspaceDeleteDialog.vue'
import WorkspaceEditDialog from './WorkspaceEditDialog.vue'
import WorkspaceEditPanel from './WorkspaceEditPanel.vue'

const { t } = useI18n()
const workspaceStore = useWorkspaceStore()
const layoutStore = useLayoutStore()
const { floatingSidebar } = storeToRefs(layoutStore)
const {
  workspaces,
  activeWorkspaceId,
  activeWorkspace,
  sortedTabs,
  activeTabId,
} = storeToRefs(workspaceStore)

// Delete workspace dialog state
const showDeleteDialog = ref(false)
const deletingWorkspaceId = ref<string | null>(null)
const deletingWorkspaceTitle = computed(() => {
  if (!deletingWorkspaceId.value)
    return ''
  const ws = workspaces.value.find(w => w.id === deletingWorkspaceId.value)
  return ws?.title ?? ''
})

// Edit workspace dialog state
const showEditDialog = ref(false)

function handleWorkspaceChange(value: unknown) {
  if (typeof value === 'string') {
    workspaceStore.setActiveWorkspace(value)
  }
}

function handleTabSelect(id: string) {
  workspaceStore.setActiveTab(id)
}

function handleTabDelete(id: string) {
  workspaceStore.deleteTab(id)
}

function handleTabReorder(newOrder: string[]) {
  if (activeWorkspaceId.value) {
    workspaceStore.reorderTabs(activeWorkspaceId.value, newOrder)
  }
}

function handleTabRename(id: string, title: string) {
  workspaceStore.renameTab(id, title)
}

function handleCreateTab() {
  if (!activeWorkspaceId.value)
    return
  const tabId = workspaceStore.createTab(activeWorkspaceId.value, t('tab.untitled'))
  workspaceStore.setActiveTab(tabId)
}

function handleDeleteWorkspace() {
  if (!activeWorkspaceId.value)
    return
  deletingWorkspaceId.value = activeWorkspaceId.value
  showDeleteDialog.value = true
}

// Storage usage
const storageUsage = ref<number | null>(null)
const storageQuota = ref<number | null>(null)

function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const storagePercentage = computed(() => {
  if (storageUsage.value === null || storageQuota.value === null || storageQuota.value === 0)
    return 0
  return Math.min(100, (storageUsage.value / storageQuota.value) * 100)
})

const formattedUsage = computed(() => formatBytes(storageUsage.value ?? 0))
const formattedQuota = computed(() => formatBytes(storageQuota.value ?? 0))

async function updateStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    storageUsage.value = estimate.usage ?? null
    storageQuota.value = estimate.quota ?? null
  }
}

let storageInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateStorageEstimate()
  // Update every 3 seconds
  storageInterval = setInterval(updateStorageEstimate, 3000)
})

onUnmounted(() => {
  if (storageInterval) {
    clearInterval(storageInterval)
  }
})

// Clear all data
const showClearDataDialog = ref(false)
const isClearing = ref(false)

// Storage info dialog
const showStorageInfoDialog = ref(false)

async function handleClearAllData() {
  isClearing.value = true
  try {
    // Get OPFS root directory and delete all files
    const root = await navigator.storage.getDirectory()
    // Delete all demiurge files
    const files = ['demiurge-workspaces.json', 'demiurge-tabs.json', 'demiurge-schemas.json', 'demiurge-app-state.json']
    for (const file of files) {
      try {
        await root.removeEntry(file)
      }
      catch {
        // File might not exist, ignore
      }
    }
    // Reload the page to reinitialize
    window.location.reload()
  }
  catch (error) {
    console.error('Failed to clear data:', error)
  }
  finally {
    isClearing.value = false
    showClearDataDialog.value = false
  }
}
</script>

<template>
  <div class="flex h-full flex-col flex-shrink overflow-hidden">
    <!-- Workspace selector and controls -->
    <div class="flex gap-1 p-1">
      <Select
        :model-value="activeWorkspaceId ?? undefined"
        @update:model-value="handleWorkspaceChange"
      >
        <SelectTrigger class="min-w-0 flex-shrink">
          <SelectValue :placeholder="t('sidebar.please_select_workspace')">
            <div v-if="activeWorkspace" class="flex items-center gap-2">
              <span
                v-if="activeWorkspace.icon"
                class="text-lg lh-0 before:content-[attr(data-value)]"
                :data-value="activeWorkspace.icon"
              />
              <span class="truncate">{{ activeWorkspace.title }}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <template v-if="workspaces.length > 0">
            <SelectItem
              v-for="ws in workspaces"
              :key="ws.id"
              :value="ws.id"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="ws.icon"
                  class="text-lg lh-0 before:content-[attr(data-value)]"
                  :data-value="ws.icon"
                />
                <span>{{ ws.title }}</span>
              </div>
            </SelectItem>
          </template>
          <div v-else class="text-muted-foreground px-2 py-4 text-center text-sm">
            <div class="i-mingcute-folder-line mx-auto mb-2 text-xl opacity-50" />
            <span>{{ t('sidebar.no_workspaces') }}</span>
          </div>
        </SelectContent>
      </Select>

      <Popover :modal="true">
        <PopoverTrigger>
          <Button size="xs" variant="outline">
            <div class="i-mingcute-add-line" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <WorkspaceEditPanel />
        </PopoverContent>
      </Popover>

      <BaseTooltip :text="floatingSidebar ? t('sidebar.pin_sidebar') : t('sidebar.unpin_sidebar')">
        <Button size="xs" variant="outline" @click="layoutStore.toggleFloatingSidebar">
          <span :class="floatingSidebar ? 'i-mingcute-pin-line' : 'i-mingcute-pin-fill'" />
        </Button>
      </BaseTooltip>
    </div>

    <!-- Tab list section -->
    <div
      v-if="activeWorkspace"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <!-- Tab header -->
      <div class="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span class="text-muted-foreground text-xs font-medium">{{ t('sidebar.tabs') }}</span>
        <Button size="xs" variant="ghost" @click="handleCreateTab">
          <div class="i-mingcute-add-line text-xs" />
        </Button>
      </div>

      <!-- Tab list -->
      <div class="flex-1 overflow-auto p-1">
        <TabList
          v-if="sortedTabs.length > 0"
          :tabs="sortedTabs"
          :active-tab-id="activeTabId"
          @select="handleTabSelect"
          @delete="handleTabDelete"
          @rename="handleTabRename"
          @reorder="handleTabReorder"
        />
        <div
          v-else
          class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-sm"
        >
          <div class="i-mingcute-file-line text-2xl opacity-50" />
          <span>{{ t('sidebar.no_tabs') }}</span>
          <Button size="sm" variant="outline" @click="handleCreateTab">
            <div class="i-mingcute-add-line mr-1" />
            {{ t('tab.create_tab') }}
          </Button>
        </div>
      </div>

      <!-- Workspace actions -->
      <div class="flex flex-col gap-1 border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-start"
          @click="showEditDialog = true"
        >
          <div class="i-mingcute-edit-2-line mr-2" />
          {{ t('workspace.edit_workspace') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start"
          @click="handleDeleteWorkspace"
        >
          <div class="i-mingcute-delete-2-line mr-2" />
          {{ t('workspace.delete_workspace') }}
        </Button>
      </div>
    </div>

    <!-- Empty state when no workspace selected -->
    <div
      v-else
      class="text-muted-foreground flex flex-1 flex-col items-center justify-center py-8"
    >
      <div class="i-mingcute-folder-line mb-2 text-3xl opacity-50" />
      <span class="text-sm">{{ t('sidebar.please_select_workspace') }}</span>
    </div>

    <!-- Storage usage bar -->
    <div
      v-if="storageQuota !== null"
      class="border-t border-border px-2 py-2"
    >
      <div class="mb-1 flex items-center justify-between">
        <span class="text-muted-foreground flex items-center gap-1 text-xs">
          {{ t('sidebar.storage_usage', { used: formattedUsage, total: formattedQuota }) }}
          <button
            class="text-muted-foreground/50 hover:text-muted-foreground i-mingcute-information-line cursor-pointer transition-colors"
            @click="showStorageInfoDialog = true"
          />
        </span>
        <BaseTooltip :text="t('sidebar.clear_all_data')">
          <Button
            size="xs"
            variant="ghost"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 -mr-1 size-5 p-0"
            @click="showClearDataDialog = true"
          >
            <span class="i-mingcute-delete-2-line text-xs" />
          </Button>
        </BaseTooltip>
      </div>
      <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="storagePercentage > 90 ? 'bg-destructive' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-primary'"
          :style="{ width: `${storagePercentage}%` }"
        />
      </div>
    </div>

    <!-- Clear all data dialog -->
    <AlertDialog v-model:open="showClearDataDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('sidebar.clear_all_data_title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('sidebar.clear_all_data_description') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isClearing">
            {{ t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isClearing"
            @click="handleClearAllData"
          >
            <span v-if="isClearing" class="i-mingcute-loading-3-line mr-1 animate-spin" />
            {{ t('sidebar.clear_all_data_confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Delete workspace dialog -->
    <WorkspaceDeleteDialog
      v-model:open="showDeleteDialog"
      :workspace-id="deletingWorkspaceId"
      :workspace-title="deletingWorkspaceTitle"
    />

    <!-- Edit workspace dialog -->
    <WorkspaceEditDialog
      v-model:open="showEditDialog"
      :workspace-id="activeWorkspaceId"
      :initial-icon="activeWorkspace?.icon ?? ''"
      :initial-title="activeWorkspace?.title ?? ''"
    />

    <!-- Storage info dialog -->
    <Dialog v-model:open="showStorageInfoDialog">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ t('sidebar.storage_info_title') }}</DialogTitle>
          <DialogDescription class="whitespace-pre-line">
            {{ t('sidebar.storage_info_description') }}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </div>
</template>
