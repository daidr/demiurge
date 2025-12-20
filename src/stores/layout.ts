import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const isBrowserSupported = computed(() => {
    const opfs = !!navigator?.storage?.getDirectory
    return opfs
  })
  const showSidebar = ref(true)
  const showToolPanel = ref(true)

  function toggleSidebar() {
    showSidebar.value = !showSidebar.value
  }

  function toggleToolPanel() {
    showToolPanel.value = !showToolPanel.value
  }

  return {
    isBrowserSupported,
    showSidebar,
    showToolPanel,
    toggleSidebar,
    toggleToolPanel,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLayoutStore, import.meta.hot))
}
