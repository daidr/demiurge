<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { useToolsStore } from '@/stores/tools'

const emit = defineEmits<{
  sorted: [content: string]
}>()

const { t } = useI18n()
const toolsStore = useToolsStore()
const { isSorting } = storeToRefs(toolsStore)

async function handleSort() {
  const sorted = await toolsStore.sortCurrentJson()
  if (sorted !== null) {
    toolsStore.setCurrentJsonContent(sorted)
    emit('sorted', sorted)
  }
}
</script>

<template>
  <BaseTooltip :text="t('tools.sort_json_keys')">
    <Button size="xs" variant="ghost" :disabled="isSorting" @click="handleSort">
      <span v-if="isSorting" class="i-mingcute-loading-3-fill animate-spin" />
      <span v-else class="i-mingcute-sort-ascending-line" />
    </Button>
  </BaseTooltip>
</template>
