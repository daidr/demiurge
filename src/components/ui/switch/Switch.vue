<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SwitchRoot,
  SwitchThumb,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<SwitchRootProps & {
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
}>(), {
  size: 'default',
})

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const rootClass = computed(() => {
  const sizeClasses = {
    default: 'h-[1.15rem] w-8',
    sm: 'h-4 w-7',
  }
  return sizeClasses[props.size]
})

const thumbClass = computed(() => {
  const sizeClasses = {
    default: 'size-4',
    sm: 'size-3',
  }
  return sizeClasses[props.size]
})
</script>

<template>
  <SwitchRoot
    v-slot="slotProps"
    data-slot="switch"
    v-bind="forwarded"
    :class="cn(
      'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      rootClass,
      props.class,
    )"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn('bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0', thumbClass)"
    >
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
