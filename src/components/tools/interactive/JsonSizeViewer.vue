<script setup lang="ts">
import type { SizeViewerMode } from '@/stores/tools'
import { storeToRefs } from 'pinia'
import { JsonTree } from '@/components/base/JsonTree'
import { Label } from '@/components/ui/label'
import { Sunburst } from '@/components/ui/sunburst'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Treemap } from '@/components/ui/treemap'
import { useToolsStore } from '@/stores/tools'

const toolsStore = useToolsStore()
const { sizeTree, expandedPaths, sizeViewerMode, flattenEnabled, isCalculating } = storeToRefs(toolsStore)

function handleToggle(path: string) {
  toolsStore.toggleSizeTreeNode(path)
}

function handleModeChange(value: string | string[]) {
  if (typeof value === 'string' && (value === 'tree' || value === 'treemap' || value === 'sunburst')) {
    toolsStore.setSizeViewerMode(value as SizeViewerMode)
  }
}

function handleFlattenChange(event: Event) {
  const target = event.target as HTMLInputElement
  toolsStore.setFlattenEnabled(target.checked)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Mode toggle -->
    <div class="flex-shrink-0 pb-2 flex items-center gap-3">
      <ToggleGroup
        type="single"
        :model-value="sizeViewerMode"
        @update:model-value="handleModeChange"
      >
        <ToggleGroupItem value="tree" class="text-xs px-2 gap-1">
          <span class="i-mingcute-list-check-line" />
          Tree
        </ToggleGroupItem>
        <ToggleGroupItem value="treemap" class="text-xs px-2 gap-1">
          <span class="i-mingcute-layout-grid-line" />
          Treemap
        </ToggleGroupItem>
        <ToggleGroupItem value="sunburst" class="text-xs px-2 gap-1">
          <span class="i-mingcute-sun-line" />
          Sunburst
        </ToggleGroupItem>
      </ToggleGroup>

      <Label class="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="flattenEnabled"
          class="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
          @change="handleFlattenChange"
        >
        Flatten
      </Label>
    </div>

    <!-- Content -->
    <div class="flex-grow overflow-auto min-h-0">
      <!-- Loading state -->
      <div v-if="isCalculating" class="flex items-center justify-center h-full text-muted-foreground">
        <span class="i-mingcute-loading-3-fill animate-spin text-2xl" />
      </div>

      <!-- No data state -->
      <div v-else-if="!sizeTree" class="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div class="text-center">
          <span class="i-mingcute-file-unknown-line text-3xl mb-2 block opacity-50" />
          <p>No valid JSON to analyze</p>
        </div>
      </div>

      <!-- Tree mode -->
      <JsonTree
        v-else-if="sizeViewerMode === 'tree'"
        :node="sizeTree"
        :expanded-paths="expandedPaths"
        @toggle="handleToggle"
      />

      <!-- Treemap mode -->
      <Treemap
        v-else-if="sizeViewerMode === 'treemap'"
        :node="sizeTree"
        class="h-full"
      />

      <!-- Sunburst mode -->
      <Sunburst
        v-else
        :node="sizeTree"
        class="h-full"
      />
    </div>
  </div>
</template>
