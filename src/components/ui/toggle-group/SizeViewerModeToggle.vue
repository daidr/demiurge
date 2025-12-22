<script setup lang="ts">
import type { ToggleGroupSize } from './ToggleGroup.vue'
import type { SizeViewerMode } from '@/stores/tools'
import { useI18n } from 'vue-i18n'
import { ToggleGroup, ToggleGroupItem } from '.'

withDefaults(defineProps<{
  modelValue?: SizeViewerMode
  size?: ToggleGroupSize
}>(), {
  modelValue: 'tree',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: SizeViewerMode]
}>()

const { t } = useI18n()

function handleChange(value: string | string[]) {
  if (typeof value === 'string' && (value === 'tree' || value === 'sunburst')) {
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
    <ToggleGroupItem value="tree" class="gap-1">
      <span class="i-mingcute-list-check-line" />
      {{ t('tools.tree') }}
    </ToggleGroupItem>
    <ToggleGroupItem value="sunburst" class="gap-1">
      <span class="i-mingcute-sun-line" />
      {{ t('tools.sunburst') }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
