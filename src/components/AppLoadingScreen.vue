<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  stage: 'db' | 'workspace' | 'ready'
}

const props = defineProps<Props>()
const { t } = useI18n()

const progress = computed(() => {
  switch (props.stage) {
    case 'db':
      return 33
    case 'workspace':
      return 66
    case 'ready':
      return 100
    default:
      return 0
  }
})

const stageText = computed(() => {
  switch (props.stage) {
    case 'db':
      return t('general.loading_db')
    case 'workspace':
      return t('general.loading_workspace')
    case 'ready':
      return t('general.loading_ready')
    default:
      return t('general.loading_db')
  }
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-6">
      <!-- Logo/App Name -->
      <div class="flex items-center gap-3">
        <div class="i-custom-demiurge text-6xl text-primary" />
        <h1 class="text-4xl font-semibold">
          Demiurge
        </h1>
      </div>

      <!-- Progress Bar -->
      <div class="w-80">
        <div class="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            class="h-full bg-primary transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="mt-3 text-center text-sm text-muted-foreground">
          {{ stageText }}
        </p>
      </div>
    </div>
  </div>
</template>
