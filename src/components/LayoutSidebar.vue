<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
          <SelectValue :placeholder="t('sidebar.please_select_workspace')" />
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

      <!-- Delete workspace button -->
      <div class="border-t border-border p-2">
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
      class="text-muted-foreground flex flex-col items-center justify-center py-8"
      :class="{ 'flex-grow': !floatingSidebar }"
    >
      <div class="i-mingcute-folder-line mb-2 text-3xl opacity-50" />
      <span class="text-sm">{{ t('sidebar.please_select_workspace') }}</span>
    </div>

    <!-- Delete workspace dialog -->
    <WorkspaceDeleteDialog
      v-model:open="showDeleteDialog"
      :workspace-id="deletingWorkspaceId"
      :workspace-title="deletingWorkspaceTitle"
    />
  </div>
</template>
