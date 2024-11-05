<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Pane, Splitpanes } from 'splitpanes'
import LayoutSidebar from './LayoutSidebar.vue'
import LayoutSchemaEditor from './LayoutSchemaEditor.vue'
import { useLayoutStore } from '@/stores/layout'
import 'splitpanes/dist/splitpanes.css'

const layoutStore = useLayoutStore()
const { showSidebar, showSchemaPanel } = storeToRefs(layoutStore)
</script>

<template>
  <div class="flex-grow">
    <Splitpanes>
      <Pane v-if="showSidebar" min-size="5" max-size="20">
        <LayoutSidebar />
      </Pane>
      <Pane min-size="30">
        <Splitpanes horizontal>
          <Pane v-if="!showSchemaPanel" min-size="5">
            <LayoutSchemaEditor />
          </Pane>
          <Pane min-size="5">
            <span>3</span>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane v-if="showSidebar" min-size="30">
        <span>4</span>
      </Pane>
    </Splitpanes>
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
