<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export type ToggleGroupSize = 'default' | 'sm'

export const toggleGroupSizeKey = Symbol('toggleGroupSize') as InjectionKey<Ref<ToggleGroupSize>>
</script>

<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { computed, provide, toRef } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ToggleGroupRootProps & {
  class?: HTMLAttributes['class']
  size?: ToggleGroupSize
}>(), {
  size: 'default',
})
const emits = defineEmits<ToggleGroupRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, size: __, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

provide('toggleGroupVariant', props.type)
provide(toggleGroupSizeKey, toRef(props, 'size'))

const sizeClass = computed(() => {
  const sizeClasses = {
    default: 'p-1',
    sm: 'p-0.5',
  }
  return sizeClasses[props.size]
})
</script>

<template>
  <ToggleGroupRoot
    v-bind="forwarded"
    :class="cn(
      'inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground',
      sizeClass,
      props.class,
    )"
  >
    <slot />
  </ToggleGroupRoot>
</template>
