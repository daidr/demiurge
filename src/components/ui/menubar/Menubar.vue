<script setup lang="ts">
import type { MenubarRootEmits, MenubarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import {
  MenubarRoot,

  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <MenubarRoot
    v-bind="forwarded"
    :class="
      cn(
        'flex h-7 items-center space-x-1 bg-background',
        props.class,
      )
    "
  >
    <slot />
  </MenubarRoot>
</template>
