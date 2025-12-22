import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface AppSettings {
  showGitHubButton: boolean
  defaultToolTab: 'size-viewer' | 'playground'
  defaultSizeViewerMode: 'tree' | 'sunburst'
  defaultPlaygroundMode: 'javascript' | 'jsonpath'
  defaultPlaygroundAutoRun: boolean
  autoFormatOnPaste: boolean
}

const SETTINGS_KEY = 'demiurge-app-settings'

const defaultSettings: AppSettings = {
  showGitHubButton: true,
  defaultToolTab: 'size-viewer',
  defaultSizeViewerMode: 'tree',
  defaultPlaygroundMode: 'javascript',
  defaultPlaygroundAutoRun: false,
  autoFormatOnPaste: true,
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultSettings, ...parsed }
    }
  }
  catch {
    // Ignore parse errors
  }
  return { ...defaultSettings }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }
  catch {
    // Ignore storage errors
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())

  // Watch for changes and persist
  watch(settings, (newSettings) => {
    saveSettings(newSettings)
  }, { deep: true })

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    settings.value[key] = value
  }

  function resetSettings() {
    settings.value = { ...defaultSettings }
  }

  return {
    settings,
    updateSetting,
    resetSettings,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
}
