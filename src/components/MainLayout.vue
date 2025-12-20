<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Pane, Splitpanes } from 'splitpanes'
// import 'splitpanes/dist/splitpanes.css'

import { useLayoutStore } from '@/stores/layout'
import LayoutJsonEditor from './LayoutJsonEditor.vue'
import LayoutSchemaEditor from './LayoutSchemaEditor.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import ToolPanel from './tools/ToolPanel.vue'
import 'splitpanes/dist/splitpanes.css'

const layoutStore = useLayoutStore()
const { showSidebar, showSchemaPanel, showToolPanel } = storeToRefs(layoutStore)
</script>

<template>
  <div class="flex-grow h-0">
    <Splitpanes>
      <Pane v-if="showSidebar" min-size="15" max-size="30">
        <LayoutSidebar />
      </Pane>
      <Pane min-size="30">
        <Splitpanes horizontal>
          <Pane v-if="!showSchemaPanel" min-size="10">
            <LayoutSchemaEditor />
          </Pane>
          <Pane min-size="10">
            <LayoutJsonEditor />
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane v-if="showToolPanel" min-size="20" max-size="50">
        <ToolPanel />
      </Pane>
    </Splitpanes>
  </div>
  <!-- <ResizablePanelGroup id="global-group" direction="horizontal">
    <ResizablePanel v-if="showSidebar" id="sidebar-panel" :min-size="10" :max-size="30" :default-size="15">
      <LayoutSidebar />
    </ResizablePanel>
    <ResizableHandle v-if="showSidebar" id="handle-1" />
    <ResizablePanel id="main-panel">
      <ResizablePanelGroup id="editor-group" direction="horizontal">
        <ResizablePanel id="left-panel" :min-size="20" :max-size="80">
          <ResizablePanelGroup id="editor-group-2" direction="vertical">
            <ResizablePanel id="top-panel" :min-size="20" :max-size="80">
              <LayoutSchemaEditor />
            </ResizablePanel>
            <ResizableHandle id="handle-3" />
            <ResizablePanel id="bottom-panel">
              3
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle id="handle-2" />
        <ResizablePanel id="right-panel">
          4
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizablePanel>
  </ResizablePanelGroup> -->
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
