<script setup lang="ts">
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { useToolsStore } from '@/stores/tools'

const emit = defineEmits<{
  sorted: [content: string]
}>()

const toolsStore = useToolsStore()

function handleSort() {
  const sorted = toolsStore.sortCurrentJson()
  if (sorted !== null) {
    toolsStore.setCurrentJsonContent(sorted)
    emit('sorted', sorted)
  }
}
</script>

<template>
  <BaseTooltip text="Sort JSON Keys">
    <Button size="xs" variant="ghost" @click="handleSort">
      <span class="i-mingcute-sort-ascending-line" />
    </Button>
  </BaseTooltip>
</template>
