<script setup lang="ts">
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { storeToRefs } from 'pinia'
import MainHeader from './components/MainHeader.vue'
import MainLayout from './components/MainLayout.vue'
import { useInitI18n } from './composables/useInitI18n'
import { useLayoutStore } from './stores/layout'

useInitI18n()

const layoutStore = useLayoutStore()
const { isBrowserSupported } = storeToRefs(layoutStore)
</script>

<template>
  <TooltipProvider>
    <MainHeader />
    <MainLayout v-if="isBrowserSupported" />
    <div v-else class="flex flex-grow items-center justify-center px-6">
      {{ $t('general.browser_not_supported_tips') }}
    </div>
  </TooltipProvider>
</template>

<style scoped></style>
