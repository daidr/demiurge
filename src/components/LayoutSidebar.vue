<script setup lang="ts">
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
import { DRAFT_WORKSPACE_ID, useWorkspaceStore, WorkspaceStatus } from '@/stores/workspace'
import BaseTooltip from './BaseTooltip.vue'
import { Button } from './ui/button'
import WorkspaceEditPanel from './WorkspaceEditPanel.vue'

const workspaceStore = useWorkspaceStore()
</script>

<template>
  <div>
    <div class="flex gap-1 p-1">
      <Select>
        <SelectTrigger class="min-w-0 flex-shrink">
          <SelectValue :placeholder="$t('sidebar.please_select_workspace')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="workspace in workspaceStore.workspaces" :key="workspace.id.value"
            :disabled="workspace.status.value !== WorkspaceStatus.Done"
            :value="workspace.id.value"
          >
            <div class="flex items-center gap-2">
              <div class="w-18px flex flex-shrink-0 items-center">
                <template v-if="workspace.status.value === WorkspaceStatus.Done">
                  <span
                    v-if="workspace.metadata?.value?.icon" class="text-lg lh-0 before:content-[attr(data-value)]"
                    :data-value="workspace.metadata.value.icon"
                  />
                </template>
                <span
                  v-else-if="workspace.status.value === WorkspaceStatus.Loading"
                  class="i-mingcute-loading-3-line block animate-spin text-lg"
                />
                <BaseTooltip
                  v-else-if="workspace.status.value === WorkspaceStatus.Failed"
                  :text="workspace.error?.value?.message ?? ''"
                >
                  <span class="i-mingcute-alert-fill pointer-events-auto block text-lg text-orange-600" />
                </BaseTooltip>
              </div>

              <span>{{ workspace.id.value === DRAFT_WORKSPACE_ID ? $t('sidebar.draft_workspace')
                : workspace.metadata?.value?.title ?? workspace.id.value }}</span>
            </div>
          </SelectItem>
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
    </div>
  </div>
</template>

<style scoped></style>
