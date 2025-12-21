<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Pane, Splitpanes } from 'splitpanes'

import { useLayoutStore } from '@/stores/layout'
import { useWorkspaceStore } from '@/stores/workspace'
import EmptyState from './EmptyState.vue'
import LayoutJsonEditor from './LayoutJsonEditor.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import ToolPanel from './tools/ToolPanel.vue'
import 'splitpanes/dist/splitpanes.css'

const layoutStore = useLayoutStore()
const workspaceStore = useWorkspaceStore()
const { showSidebar, showToolPanel, floatingSidebar } = storeToRefs(layoutStore)
const { hasActiveTab } = storeToRefs(workspaceStore)
</script>

<template>
  <div class="h-0 flex flex-grow">
    <aside
      v-if="showSidebar" class="flex-shrink-0"
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
        <Splitpanes>
          <Pane min-size="35">
            <LayoutJsonEditor />
          </Pane>
          <Pane v-if="showToolPanel" min-size="35">
            <ToolPanel />
          </Pane>
        </Splitpanes>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.splitpanes__splitter) {
  @apply bg-gray-2;
  position: relative;
}

:deep(.splitpanes__splitter:before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  background-color: rgba(0, 0, 0, 0.2);
  opacity: 0;
  z-index: 10;
}

:deep(.splitpanes__splitter:hover:before) {
  opacity: 1;
}

:deep(.splitpanes--vertical > .splitpanes__splitter) {
  width: 1.5px;
}

:deep(.splitpanes--horizontal > .splitpanes__splitter) {
  height: 1.5px;
}

:deep(.splitpanes--vertical > .splitpanes__splitter:before) {
  left: -4px;
  right: -4px;
  height: 100%;
}

:deep(.splitpanes--horizontal > .splitpanes__splitter:before) {
  top: -4px;
  bottom: -4px;
  width: 100%;
}
</style>
