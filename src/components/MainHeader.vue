<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLayoutStore } from '@/stores/layout'
import { useSettingsStore } from '@/stores/settings'
import { isMac } from '@/utils/platform'
import { installFunction, showInstallButton } from '@/utils/pwa'
import ModeToggle from './ModeToggle.vue'
import MainMenu from './ui/MainMenu.vue'

const { t } = useI18n()

const layoutStore = useLayoutStore()
const settingsStore = useSettingsStore()
const { isBrowserSupported, showSidebar } = storeToRefs(layoutStore)
const { settings } = storeToRefs(settingsStore)

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

// Shortcut key display
const modKey = isMac() ? '⌘' : 'Ctrl'
</script>

<template>
  <header
    class="header flex select-none items-center justify-between border-b-1.5 border-border"
    :class="{ 'wco-mode': isWCOMode }"
  >
    <div class="header-left ml-1 flex items-center gap-1">
      <BaseTooltip :text="t('menu.toggle_sidebar')">
        <Button size="xs" variant="ghost" @click="layoutStore.toggleSidebar">
          <span
            class="text-lg"
            :class="showSidebar ? 'i-mingcute-layout-leftbar-close-line' : 'i-mingcute-layout-left-line'"
          />
        </Button>
        <template #kbd>
          <KbdGroup>
            <Kbd>{{ modKey }}</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
        </template>
      </BaseTooltip>
      <MainMenu :disabled="!isBrowserSupported" />
    </div>
    <div class="header-right flex gap-1 p-1">
      <Tooltip v-if="showInstallButton">
        <TooltipTrigger as-child>
          <Button size="xs" variant="outline" @click="handleInstall">
            <div class="i-mingcute-download-2-line" />
            {{ t('pwa.install') }}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ t('pwa.install_tooltip') }}
        </TooltipContent>
      </Tooltip>
      <ModeToggle />
      <Button
        v-if="settings.showGitHubButton" size="xs" variant="outline" as="a"
        href="https://github.com/daidr/demiurge" target="_blank" rel="noopener noreferrer"
      >
        <div class="i-mingcute-github-line" />
      </Button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  height: 38px;
}

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
    padding-right: calc(100% - env(titlebar-area-width, 100%) - env(titlebar-area-x, 0) + 2px);
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }
}
</style>
