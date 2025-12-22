<script setup lang="ts">
import type { ToggleGroupSize } from './ToggleGroup.vue'
import type { PlaygroundMode } from '@/db'
import { ToggleGroup, ToggleGroupItem } from '.'

withDefaults(defineProps<{
  modelValue?: PlaygroundMode
  size?: ToggleGroupSize
  disabled?: boolean
  showIcon?: boolean
}>(), {
  modelValue: 'javascript',
  size: 'default',
  disabled: false,
  showIcon: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: PlaygroundMode]
}>()

function handleChange(value: string | string[]) {
  if (typeof value === 'string' && (value === 'javascript' || value === 'jsonpath')) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <ToggleGroup
    type="single"
    :model-value="modelValue"
    :size="size"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    <ToggleGroupItem value="javascript" class="gap-1">
      <span v-if="showIcon" class="i-mingcute-code-line" />
      JavaScript
    </ToggleGroupItem>
    <ToggleGroupItem value="jsonpath" class="gap-1">
      <span v-if="showIcon" class="i-mingcute-route-line" />
      JSONPath
    </ToggleGroupItem>
  </ToggleGroup>
</template>
