<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToolsStore } from '@/stores/tools'
import JsonPlayground from './interactive/JsonPlayground.vue'
import JsonSizeViewer from './interactive/JsonSizeViewer.vue'
import ToolHeader from './ToolHeader.vue'

const toolsStore = useToolsStore()
const { activeTab } = storeToRefs(toolsStore)

function handleTabChange(value: string) {
  toolsStore.setActiveTab(value as 'size-viewer' | 'playground')
}
</script>

<template>
  <div class="h-full flex flex-col bg-background">
    <ToolHeader />

    <Tabs :model-value="activeTab" class="flex-grow flex flex-col overflow-hidden" @update:model-value="handleTabChange">
      <TabsList class="mx-2 mt-2 w-auto justify-start">
        <TabsTrigger value="size-viewer" class="gap-1">
          <span class="i-mingcute-chart-pie-2-line" />
          <span>Size Viewer</span>
        </TabsTrigger>
        <TabsTrigger value="playground" class="gap-1">
          <span class="i-mingcute-terminal-box-line" />
          <span>Playground</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="size-viewer" class="flex-grow overflow-hidden p-2 mt-0 min-h-0">
        <JsonSizeViewer />
      </TabsContent>

      <TabsContent value="playground" class="flex-grow overflow-hidden p-2 mt-0 min-h-0">
        <JsonPlayground />
      </TabsContent>
    </Tabs>
  </div>
</template>
