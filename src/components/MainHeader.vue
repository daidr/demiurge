<script setup lang="ts">
import { Button } from '@/components/ui/button'
import LangSwitch from './LangSwitch.vue'
import MainMenu from './ui/MainMenu.vue'
import { storeToRefs } from 'pinia';
import { useLayoutStore } from '@/stores/layout';

const layoutStore = useLayoutStore()
const { isBrowserSupported } = storeToRefs(layoutStore)
</script>

<template>
  <header class="flex select-none items-center justify-between border-b-1.5 border-gray-2">
    <div class="ml-1 flex items-center gap-1">
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
