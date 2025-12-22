<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'

import { useLayoutStore } from '@/stores/layout'
import { useWorkspaceStore } from '@/stores/workspace'
import EmptyState from './EmptyState.vue'
import LayoutJsonEditor from './LayoutJsonEditor.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import ToolPanel from './tools/ToolPanel.vue'

const layoutStore = useLayoutStore()
const workspaceStore = useWorkspaceStore()
const { showSidebar, showToolPanel, floatingSidebar } = storeToRefs(layoutStore)
const { hasActiveTab } = storeToRefs(workspaceStore)

// Close floating sidebar on ESC
onKeyStroke('Escape', () => {
  if (floatingSidebar.value && showSidebar.value) {
    layoutStore.toggleSidebar()
  }
})
</script>

<template>
  <div class="h-0 flex flex-grow">
    <aside
      v-if="showSidebar"
      class="flex-shrink-0"
      :class="floatingSidebar ? 'absolute left-2 top-11 bottom-2 z-50' : 'relative h-full'"
    >
      <div class=" bg-background" :class="floatingSidebar ? 'shadow-xl rounded-lg border-1.5 w-64 min-h-0 max-h-full flex flex-col' : 'w-64 border-r border-border h-full'">
        <LayoutSidebar />
      </div>
    </aside>

    <div class="min-w-0 flex-grow">
      <!-- Show empty state when no tab is selected -->
      <template v-if="!hasActiveTab">
        <EmptyState />
      </template>

      <!-- Show editor and tools when a tab is selected -->
      <template v-else>
        <SplitterGroup direction="horizontal" class="h-full">
          <SplitterPanel :min-size="35">
            <LayoutJsonEditor />
          </SplitterPanel>
          <template v-if="showToolPanel">
            <SplitterResizeHandle class="splitter-handle-vertical" />
            <SplitterPanel :min-size="35">
              <ToolPanel />
            </SplitterPanel>
          </template>
        </SplitterGroup>
      </template>
    </div>
  </div>
</template>

<style scoped>
.splitter-handle-vertical {
  @apply relative w-4 flex items-center justify-center;
  margin-left: -8px;
  margin-right: -8px;
}

.splitter-handle-vertical::before {
  content: '';
  @apply absolute h-full w-px bg-border transition-all;
}

.splitter-handle-vertical:hover::before,
.splitter-handle-vertical[data-state="drag"]::before {
  @apply w-0.5 bg-primary/50;
}
</style>
