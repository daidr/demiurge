<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('text-sm select-none', $props.class)" role="tree">
    <slot />
  </div>
</template>
