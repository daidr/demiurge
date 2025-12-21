<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { SizeViewerMode } from '@/stores/tools'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { JsonTree } from '@/components/base/JsonTree'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sunburst } from '@/components/ui/sunburst'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToolsStore } from '@/stores/tools'

const { t } = useI18n()
const toolsStore = useToolsStore()
const { sizeTree, expandedPaths, sizeViewerMode, flattenEnabled, isCalculating } = storeToRefs(toolsStore)

// Detect Mac platform for showing correct modifier key hint
const isMac = computed(() => navigator.platform.toLowerCase().includes('mac'))
const altClickHint = computed(() => isMac.value ? t('tools.option_click_hint') : t('tools.alt_click_hint'))

function handleToggle(path: string) {
  toolsStore.toggleSizeTreeNode(path)
}

function handleModeChange(value: AcceptableValue) {
  if (typeof value === 'string' && (value === 'tree' || value === 'sunburst')) {
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
          {{ t('tools.tree') }}
        </ToggleGroupItem>
        <ToggleGroupItem value="sunburst" class="text-xs px-2 gap-1">
          <span class="i-mingcute-sun-line" />
          {{ t('tools.sunburst') }}
        </ToggleGroupItem>
      </ToggleGroup>

      <Label class="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <Checkbox
          :model-value="flattenEnabled"
          @update:model-value="handleFlattenChange"
        />
        {{ t('tools.flatten') }}
      </Label>

      <span v-if="!flattenEnabled" class="text-muted-foreground/60 text-xs ml-auto">
        {{ altClickHint }}
      </span>
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
          <p>{{ t('tools.no_valid_json') }}</p>
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
