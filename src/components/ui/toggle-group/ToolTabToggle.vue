<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { ToggleGroupSize } from './ToggleGroup.vue'
import type { InteractiveTool } from '@/stores/tools'
import { useI18n } from 'vue-i18n'
import { ToggleGroup, ToggleGroupItem } from '.'

withDefaults(defineProps<{
  modelValue?: InteractiveTool
  size?: ToggleGroupSize
}>(), {
  modelValue: 'size-viewer',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: InteractiveTool]
}>()

const { t } = useI18n()

function handleChange(value: AcceptableValue) {
  if (typeof value === 'string' && (value === 'size-viewer' || value === 'playground' || value === 'type-stats')) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <ToggleGroup
    type="single"
    :model-value="modelValue"
    :size="size"
    @update:model-value="handleChange"
  >
    <ToggleGroupItem value="size-viewer" class="gap-1">
      <span class="i-mingcute-pie-2-line" />
      {{ t('tools.size_viewer') }}
    </ToggleGroupItem>
    <ToggleGroupItem value="playground" class="gap-1">
      <span class="i-mingcute-terminal-box-line" />
      {{ t('tools.playground') }}
    </ToggleGroupItem>
    <ToggleGroupItem value="type-stats" class="gap-1">
      <span class="i-mingcute-chart-bar-line" />
      {{ t('tools.type_stats') }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
