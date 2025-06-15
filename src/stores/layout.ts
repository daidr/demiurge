import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const isBrowserSupported = computed(() => {
    const opfs = !!navigator?.storage?.getDirectory
    return opfs
  })
  const showSidebar = ref(true)
  const showSchemaPanel = ref(false)

  function toggleSidebar() {
    showSidebar.value = !showSidebar.value
  }

  function toggleSchemaPanel() {
    showSchemaPanel.value = !showSchemaPanel.value
  }

  return { isBrowserSupported, showSidebar, showSchemaPanel, toggleSchemaPanel, toggleSidebar }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLayoutStore, import.meta.hot))
}
