<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { useLayoutStore } from '@/stores/layout'
import LangSwitch from './LangSwitch.vue'
import MainMenu from './ui/MainMenu.vue'

const layoutStore = useLayoutStore()
const { isBrowserSupported, showSidebar } = storeToRefs(layoutStore)
</script>

<template>
  <header class="flex select-none items-center justify-between border-b-1.5 border-gray-2">
    <div class="ml-1 flex items-center gap-1">
      <Button size="xs" variant="ghost" @click="layoutStore.toggleSidebar">
        <span class="text-lg" :class="showSidebar ? 'i-mingcute-layout-top-close-fill' : 'i-mingcute-layout-top-open-line'" />
      </Button>
      <MainMenu :disabled="!isBrowserSupported" />
    </div>
    <div class="flex gap-1 p-1">
      <Button
        size="xs" variant="outline" as="a" href="https://github.com/daidr/json-baker" target="_blank"
        rel="noopener noreferrer"
      >
        <div class="i-mingcute-github-line" />
      </Button>
      <LangSwitch />
    </div>
  </header>
</template>

<style scoped lang="scss">

</style>
