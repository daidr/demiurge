import { useColorMode } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import { useCollectionQuery } from '@/composables/useCollection'
import { appStateCollection } from '@/db'

const LIGHT_THEME_COLOR = '#ffffff'
const DARK_THEME_COLOR = '#0a0a0a'
const LIGHT_THEME_COLOR_WITH_OVERLAY = '#808080'
const DARK_THEME_COLOR_WITH_OVERLAY = '#050505'

export const useLayoutStore = defineStore('layout', () => {
  const isBrowserSupported = computed(() => {
    const opfs = !!navigator?.storage?.getDirectory
    return opfs
  })

  // Tool panel is runtime-only (not persisted)
  const showToolPanel = ref(true)

  // App state (singleton) for persisted layout state
  const appStateItems = useCollectionQuery(
    appStateCollection,
    () => ({ id: 'singleton' as const }),
  )

  // Sidebar open state (persisted)
  const showSidebar = computed(() => appStateItems.value[0]?.sidebarOpen ?? true)

  // Sidebar floating state (persisted)
  const floatingSidebar = computed(() => appStateItems.value[0]?.sidebarFloating ?? false)

  // Ensure app state has layout fields
  watchEffect(() => {
    const existing = appStateCollection.findOne({ id: 'singleton' })
    if (existing && (existing.sidebarOpen === undefined || existing.sidebarFloating === undefined)) {
      appStateCollection.updateOne(
        { id: 'singleton' },
        {
          $set: {
            sidebarOpen: existing.sidebarOpen ?? true,
            sidebarFloating: existing.sidebarFloating ?? false,
          },
        },
      )
    }
  })

  function toggleSidebar() {
    appStateCollection.updateOne(
      { id: 'singleton' },
      { $set: { sidebarOpen: !showSidebar.value } },
    )
  }

  function toggleToolPanel() {
    showToolPanel.value = !showToolPanel.value
  }

  function toggleFloatingSidebar() {
    appStateCollection.updateOne(
      { id: 'singleton' },
      { $set: { sidebarFloating: !floatingSidebar.value } },
    )
  }

  function setFloatingSidebar(value: boolean) {
    appStateCollection.updateOne(
      { id: 'singleton' },
      { $set: { sidebarFloating: value } },
    )
  }

  // Track number of open dialogs
  const openDialogCount = ref(0)
  const hasDialogOpen = computed(() => openDialogCount.value > 0)

  function incrementDialogCount() {
    openDialogCount.value++
  }

  function decrementDialogCount() {
    openDialogCount.value = Math.max(0, openDialogCount.value - 1)
  }

  const mode = useColorMode()

  function setMetaThemeColorTag(color: string) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color)
    }
  }

  watch([() => hasDialogOpen.value, () => mode.value], ([hasOpen, mode]) => {
    if (hasOpen) {
      setMetaThemeColorTag(mode === 'dark' ? DARK_THEME_COLOR_WITH_OVERLAY : LIGHT_THEME_COLOR_WITH_OVERLAY)
    }
    else {
      setMetaThemeColorTag(mode === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR)
    }
  }, {
    immediate: true,
  })

  return {
    isBrowserSupported,
    showSidebar,
    showToolPanel,
    floatingSidebar,
    toggleSidebar,
    toggleToolPanel,
    toggleFloatingSidebar,
    setFloatingSidebar,
    hasDialogOpen,
    incrementDialogCount,
    decrementDialogCount,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLayoutStore, import.meta.hot))
}
