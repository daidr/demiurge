<script setup lang="ts">
import type { MenubarTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { MenubarTrigger, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <MenubarTrigger
    v-bind="forwardedProps" :class="cn(
      'logo flex cursor-default select-none items-center outline-none focus:(bg-foreground text-background shadow-md shadow-foreground/20) data-[state=open]:(bg-foreground text-background shadow-md shadow-foreground/20)',
      props.class,
    )"
  >
    <div class="i-custom-demiurge text-lg" />
    Demiurge
  </MenubarTrigger>
</template>

<style scoped lang="scss">
.logo {
  @apply flex items-center gap-2 rounded-sm px-1 py-0.5 font-bold;
}
</style>
