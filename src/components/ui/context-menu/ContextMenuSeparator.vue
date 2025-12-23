<script setup lang="ts">
import type { ContextMenuSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ContextMenuSeparator, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ContextMenuSeparator :class="cn('-mx-1 my-1 h-px bg-muted', props.class)" v-bind="forwardedProps" />
</template>
