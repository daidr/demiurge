<script setup lang="ts">
import type { ToggleGroupSize } from './ToggleGroup.vue'
import type { ToolTab } from '@/stores/tools'
import { useI18n } from 'vue-i18n'
import { ToggleGroup, ToggleGroupItem } from '.'

withDefaults(defineProps<{
  modelValue?: ToolTab
  size?: ToggleGroupSize
}>(), {
  modelValue: 'size-viewer',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: ToolTab]
}>()

const { t } = useI18n()

function handleChange(value: string | string[]) {
  if (typeof value === 'string' && (value === 'size-viewer' || value === 'playground')) {
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
  </ToggleGroup>
</template>
