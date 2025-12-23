<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLayoutStore } from '@/stores/layout'
import MainHeader from './MainHeader.vue'
import MainLayout from './MainLayout.vue'

const layoutStore = useLayoutStore()
const { isBrowserSupported } = storeToRefs(layoutStore)
</script>

<template>
  <MainHeader />
  <MainLayout v-if="isBrowserSupported" />
  <div v-else class="flex flex-grow items-center justify-center px-6">
    {{ $t('general.browser_not_supported_tips') }}
  </div>
</template>

<style scoped></style>
