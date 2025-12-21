<script setup lang="ts">
import type { ToggleGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ToggleGroupItem, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ToggleGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ToggleGroupItem
    v-bind="forwardedProps"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow',
      props.class,
    )"
  >
    <slot />
  </ToggleGroupItem>
</template>
