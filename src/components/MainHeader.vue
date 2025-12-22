<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLayoutStore } from '@/stores/layout'
import { installFunction, showInstallButton } from '@/utils/pwa'
import LangSwitch from './LangSwitch.vue'
import MainMenu from './ui/MainMenu.vue'

const { t } = useI18n()

const layoutStore = useLayoutStore()
const { isBrowserSupported, showSidebar } = storeToRefs(layoutStore)

// Detect window-controls-overlay mode
const isWCOMode = ref(false)

function updateWCOMode() {
  isWCOMode.value = navigator.windowControlsOverlay?.visible ?? false
}

function handleInstall() {
  installFunction.value?.()
}

onMounted(() => {
  updateWCOMode()
  navigator.windowControlsOverlay?.addEventListener('geometrychange', updateWCOMode)
})

onUnmounted(() => {
  navigator.windowControlsOverlay?.removeEventListener('geometrychange', updateWCOMode)
})
</script>

<template>
  <header
    class="header flex select-none items-center justify-between border-b-1.5 border-gray-2"
    :class="{ 'wco-mode': isWCOMode }"
  >
    <div class="header-left ml-1 flex items-center gap-1">
      <Button size="xs" variant="ghost" @click="layoutStore.toggleSidebar">
        <span class="text-lg" :class="showSidebar ? 'i-mingcute-layout-top-close-fill' : 'i-mingcute-layout-top-open-line'" />
      </Button>
      <MainMenu :disabled="!isBrowserSupported" />
    </div>
    <div class="header-right flex gap-1 p-1">
      <Tooltip v-if="showInstallButton">
        <TooltipTrigger as-child>
          <Button
            size="xs"
            variant="outline"
            @click="handleInstall"
          >
            <div class="i-mingcute-download-2-line" />
            {{ t('pwa.install') }}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ t('pwa.install_tooltip') }}
        </TooltipContent>
      </Tooltip>
      <Button
        size="xs" variant="outline" as="a" href="https://github.com/daidr/demiurge" target="_blank"
        rel="noopener noreferrer"
      >
        <div class="i-mingcute-github-line" />
      </Button>
      <LangSwitch />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header.wco-mode {
  // Adjust height to match titlebar
  height: calc(env(titlebar-area-height, 100%) + 1px);

  // Make header draggable
  -webkit-app-region: drag;
  app-region: drag;

  // Left padding to avoid window controls (macOS)
  .header-left {
    padding-left: env(titlebar-area-x, 0);
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }

  // Right padding to avoid window controls (Windows)
  .header-right {
    padding-right: calc(100% - env(titlebar-area-width, 100%) - env(titlebar-area-x, 0) - 2px);
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }
}
</style>
