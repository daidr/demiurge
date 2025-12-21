<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, provide } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ToggleGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ToggleGroupRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

provide('toggleGroupVariant', props.type)
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    :class="cn(
      'inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      props.class,
    )"
  >
    <slot />
  </ToggleGroupRoot>
</template>
