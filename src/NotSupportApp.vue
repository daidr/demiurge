<script setup lang="ts">
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useInitI18n } from './composables/useInitI18n'

useInitI18n()
</script>

<template>
  <TooltipProvider>
    <ReloadWithoutPrompt />
    <div class="flex flex-grow items-center justify-center px-6">
      {{ $t('general.browser_not_supported_tips') }}
    </div>
  </TooltipProvider>
</template>

<style scoped></style>
