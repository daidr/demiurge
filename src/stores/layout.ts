import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', () => {
  const showSidebar = ref(true)
  const showSchemaPanel = ref(false)

  function toggleSidebar() {
    showSidebar.value = !showSidebar.value
  }

  function toggleSchemaPanel() {
    showSchemaPanel.value = !showSchemaPanel.value
  }

  return { showSidebar, showSchemaPanel, toggleSchemaPanel, toggleSidebar }
})
