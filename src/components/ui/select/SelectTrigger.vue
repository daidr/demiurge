<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<SelectTriggerProps & {
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
}>(), {
  size: 'default',
})

const delegatedProps = computed(() => {
  const { class: _, size: __, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)

const sizeClass = computed(() => {
  const sizeClasses = {
    default: 'h-7 px-2 py-2 text-sm',
    sm: 'h-6 px-1.5 py-1 text-xs',
  }
  return sizeClasses[props.size]
})

const iconClass = computed(() => {
  const iconClasses = {
    default: 'w-4 h-4',
    sm: 'w-3 h-3',
  }
  return iconClasses[props.size]
})
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start',
      sizeClass,
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown :class="cn('opacity-50 shrink-0', iconClass)" />
    </SelectIcon>
  </SelectTrigger>
</template>
