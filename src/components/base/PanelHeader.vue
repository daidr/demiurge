<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
}>(), {
  title: '',
})
</script>

<template>
  <div class="flex items-center gap-1 px-3 py-2 border-b border-border">
    <span class="text-sm font-medium mr-auto py-1">{{ title }}</span>
    <slot />
  </div>
</template>
