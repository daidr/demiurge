<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'

const { t } = useI18n()
const mode = useColorMode()

// Cycle through modes: light -> dark -> auto -> light
function toggleMode() {
  if (mode.store.value === 'light') {
    mode.store.value = 'dark'
  }
  else if (mode.store.value === 'dark') {
    mode.store.value = 'auto'
  }
  else {
    mode.store.value = 'light'
  }
}

const tooltipText = computed(() => {
  switch (mode.store.value) {
    case 'light':
      return t('theme.light')
    case 'dark':
      return t('theme.dark')
    default:
      return t('theme.system')
  }
})

const iconClass = computed(() => {
  switch (mode.store.value) {
    case 'light':
      return 'i-mingcute-sun-line'
    case 'dark':
      return 'i-mingcute-moon-line'
    default:
      return 'i-mingcute-computer-line'
  }
})

watch(() => mode.value, (newMode) => {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(newMode)
})
</script>

<template>
  <BaseTooltip :text="tooltipText">
    <Button size="xs" variant="ghost" @click="toggleMode">
      <span :class="iconClass" />
    </Button>
  </BaseTooltip>
</template>
