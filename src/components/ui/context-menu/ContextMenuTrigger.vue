<script setup lang="ts">
import type { ContextMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ContextMenuTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ContextMenuTrigger v-bind="forwardedProps" :class="cn('outline-none', props.class)">
    <slot />
  </ContextMenuTrigger>
</template>
