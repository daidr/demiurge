<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { useToolsStore } from '@/stores/tools'

const { t } = useI18n()
const toolsStore = useToolsStore()
const isFormatting = ref(false)

async function handleFormat() {
  const content = toolsStore.currentJsonContent
  if (!content.trim()) {
    return
  }

  isFormatting.value = true
  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    toolsStore.setCurrentJsonContent(formatted)
  }
  catch {
    // Invalid JSON, do nothing
  }
  finally {
    isFormatting.value = false
  }
}
</script>

<template>
  <BaseTooltip :text="t('tools.format_json')">
    <Button size="xs" variant="ghost" :disabled="isFormatting" @click="handleFormat">
      <span v-if="isFormatting" class="i-mingcute-loading-3-fill animate-spin" />
      <span v-else class="i-mingcute-align-left-line" />
    </Button>
  </BaseTooltip>
</template>
