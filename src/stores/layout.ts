import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const isBrowserSupported = computed(() => {
    const opfs = !!navigator?.storage?.getDirectory
    return opfs
  })
  const showSidebar = ref(true)
  const showToolPanel = ref(true)
  const floatingSidebar = ref(false)

  function toggleSidebar() {
    showSidebar.value = !showSidebar.value
  }

  function toggleToolPanel() {
    showToolPanel.value = !showToolPanel.value
  }

  function toggleFloatingSidebar() {
    floatingSidebar.value = !floatingSidebar.value
  }

  function setFloatingSidebar(value: boolean) {
    floatingSidebar.value = value
  }

  return {
    isBrowserSupported,
    showSidebar,
    showToolPanel,
    floatingSidebar,
    toggleSidebar,
    toggleToolPanel,
    toggleFloatingSidebar,
    setFloatingSidebar,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLayoutStore, import.meta.hot))
}
