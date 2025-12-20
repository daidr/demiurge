<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { SizeViewerMode } from '@/stores/tools'
import { storeToRefs } from 'pinia'
import { JsonTree } from '@/components/base/JsonTree'
import { Checkbox } from '@/components/ui/checkbox'
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

function handleModeChange(value: AcceptableValue) {
  if (typeof value === 'string' && (value === 'tree' || value === 'treemap' || value === 'sunburst')) {
    toolsStore.setSizeViewerMode(value as SizeViewerMode)
  }
}

function handleFlattenChange(checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate')
    return
  toolsStore.setFlattenEnabled(checked)
}

function handleNodeClick(path: string, event: MouseEvent) {
  if (event.altKey) {
    event.stopPropagation()
    event.preventDefault()
    toolsStore.navigateToJsonPath(path)
  }
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
        <Checkbox
          :model-value="flattenEnabled"
          @update:model-value="handleFlattenChange"
        />
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
        <div class="text-center flex flex-col items-center justify-center">
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
        @node-click="handleNodeClick"
      />

      <!-- Treemap mode -->
      <Treemap
        v-else-if="sizeViewerMode === 'treemap'"
        :node="sizeTree"
        class="h-full"
        @node-click="handleNodeClick"
      />

      <!-- Sunburst mode -->
      <Sunburst
        v-else
        :node="sizeTree"
        class="h-full"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>
