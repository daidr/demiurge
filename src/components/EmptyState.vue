<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex h-full w-full flex-col items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <div class="i-custom-demiurge text-6xl opacity-30" />
      <h1 class="text-muted-foreground text-2xl font-semibold">
        Demiurge
      </h1>
      <p class="text-muted-foreground/70 text-sm">
        {{ t('empty_state.select_or_create_tab') }}
      </p>
    </div>
  </div>
</template>
