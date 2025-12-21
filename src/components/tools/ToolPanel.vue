<script setup lang="ts">
import type { StringOrNumber } from '@visactor/vchart'
import { storeToRefs } from 'pinia'
import PanelHeader from '@/components/base/PanelHeader.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToolsStore } from '@/stores/tools'
import JsonPlayground from './interactive/JsonPlayground.vue'
import JsonSizeViewer from './interactive/JsonSizeViewer.vue'

const toolsStore = useToolsStore()
const { activeToolTab } = storeToRefs(toolsStore)

function handleTabChange(value: StringOrNumber) {
  toolsStore.setActiveToolTab(value as 'size-viewer' | 'playground')
}
</script>

<template>
  <div class="h-full flex flex-col bg-background">
    <Tabs :model-value="activeToolTab" class="flex-grow flex flex-col overflow-hidden" @update:model-value="handleTabChange">
      <PanelHeader title="Tools">
        <TabsList class="h-7">
          <TabsTrigger value="size-viewer" class="gap-1 text-xs h-6 px-2">
            <span class="i-mingcute-chart-pie-2-line" />
            <span>Size Viewer</span>
          </TabsTrigger>
          <TabsTrigger value="playground" class="gap-1 text-xs h-6 px-2">
            <span class="i-mingcute-terminal-box-line" />
            <span>Playground</span>
          </TabsTrigger>
        </TabsList>
      </PanelHeader>

      <TabsContent value="size-viewer" class="flex-grow overflow-hidden p-2 mt-0 min-h-0">
        <JsonSizeViewer />
      </TabsContent>

      <TabsContent value="playground" class="flex-grow overflow-hidden p-2 mt-0 min-h-0">
        <JsonPlayground />
      </TabsContent>
    </Tabs>
  </div>
</template>
