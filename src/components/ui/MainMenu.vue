<script setup lang="ts">
import hotkeys from 'hotkeys-js'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AboutDialog from '@/components/AboutDialog.vue'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import LogoMenubarTrigger from '@/components/ui/menubar/LogoMenubarTrigger.vue'
import WorkspaceCreateDialog from '@/components/WorkspaceCreateDialog.vue'
import { useLayoutStore } from '@/stores/layout'
import { useToolsStore } from '@/stores/tools'
import { useWorkspaceStore } from '@/stores/workspace'

defineProps<{
  disabled?: boolean
}>()

const { t } = useI18n()
const layoutStore = useLayoutStore()
const toolsStore = useToolsStore()
const workspaceStore = useWorkspaceStore()
const { activeWorkspaceId } = storeToRefs(workspaceStore)

// Whether tab-related menu items should be disabled
const isTabMenuDisabled = computed(() => !activeWorkspaceId.value)

// Check if running as installed PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: window-controls-overlay)').matches
  || (navigator as any).standalone === true

// Dialog state for new workspace
const showNewWorkspaceDialog = ref(false)

const showAboutDialog = ref(false)

function toggleSidePanel() {
  layoutStore.toggleSidebar()
}

function toggleToolPanel() {
  layoutStore.toggleToolPanel()
}

async function sortJson() {
  const sorted = await toolsStore.sortCurrentJson()
  if (sorted !== null) {
    toolsStore.setCurrentJsonContent(sorted)
  }
}

function handleNewTab() {
  if (!activeWorkspaceId.value)
    return
  const tabId = workspaceStore.createTab(activeWorkspaceId.value, t('tab.untitled'))
  workspaceStore.setActiveTab(tabId)
}

async function handleNewTabFromClipboard() {
  if (!activeWorkspaceId.value)
    return

  try {
    const text = await navigator.clipboard.readText()
    const tabId = workspaceStore.createTab(activeWorkspaceId.value, t('tab.untitled'))
    workspaceStore.setActiveTab(tabId)
    // Set the content after creating the tab
    workspaceStore.updateTabContent(tabId, text)
  }
  catch {
    // Clipboard access denied or empty
  }
}

async function handleNewTabFromFile() {
  if (!activeWorkspaceId.value)
    return

  try {
    // Use File System Access API
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'JSON files',
          accept: { 'application/json': ['.json'] },
        },
      ],
      multiple: false,
    })
    const file = await fileHandle.getFile()
    const content = await file.text()
    // Use file name without extension as tab title
    const fileName = file.name.replace(/\.json$/i, '') || t('tab.untitled')
    const tabId = workspaceStore.createTab(activeWorkspaceId.value, fileName)
    workspaceStore.setActiveTab(tabId)
    workspaceStore.updateTabContent(tabId, content)
  }
  catch {
    // User cancelled or file read error
  }
}

onMounted(() => {
  // Toggle sidebar is always available (not affected by PWA mode)
  hotkeys('command+b, ctrl+b', (e) => {
    e.preventDefault()
    toggleSidePanel()
  })

  // Other hotkeys only available in PWA mode
  if (!isPWA)
    return

  hotkeys('command+t, ctrl+t', (e) => {
    e.preventDefault()
    toggleToolPanel()
  })
  hotkeys('command+shift+s, ctrl+shift+s', (e) => {
    e.preventDefault()
    sortJson()
  })
  hotkeys('command+shift+n, ctrl+shift+n', (e) => {
    e.preventDefault()
    showNewWorkspaceDialog.value = true
    return false
  })
  hotkeys('command+n, ctrl+n', (e) => {
    e.preventDefault()
    handleNewTab()
    return false
  })
  hotkeys('command+alt+n, ctrl+alt+n', (e) => {
    e.preventDefault()
    handleNewTabFromClipboard()
    return false
  })
  hotkeys('command+alt+o, ctrl+alt+o', (e) => {
    e.preventDefault()
    handleNewTabFromFile()
    return false
  })
})

onUnmounted(() => {
  // Toggle sidebar is always registered
  hotkeys.unbind('command+b, ctrl+b')

  if (!isPWA)
    return

  hotkeys.unbind('command+t, ctrl+t')
  hotkeys.unbind('command+shift+s, ctrl+shift+s')
  hotkeys.unbind('command+shift+n, ctrl+shift+n')
  hotkeys.unbind('command+n, ctrl+n')
  hotkeys.unbind('command+alt+n, ctrl+alt+n')
  hotkeys.unbind('command+alt+o, ctrl+alt+o')
})
</script>

<template>
  <Menubar>
    <MenubarMenu>
      <LogoMenubarTrigger />
      <MenubarContent>
        <!-- <MenubarItem>
          Preferences <MenubarShortcut>⌘,</MenubarShortcut>
        </MenubarItem> -->
        <!-- <MenubarSeparator /> -->
        <MenubarItem @click="showAboutDialog = true">
          About
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <AboutDialog v-model:open="showAboutDialog" />
    <WorkspaceCreateDialog v-model:open="showNewWorkspaceDialog" />
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger>{{ t('menu.file') }}</MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="showNewWorkspaceDialog = true">
          {{ t('menu.new_workspace') }} <MenubarShortcut v-if="isPWA">
            ⇧⌘N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTab">
          {{ t('menu.new_tab') }} <MenubarShortcut v-if="isPWA">
            ⌘N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTabFromClipboard">
          {{ t('menu.new_tab_from_clipboard') }} <MenubarShortcut v-if="isPWA">
            ⌥⌘N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTabFromFile">
          {{ t('menu.new_tab_from_file') }} <MenubarShortcut v-if="isPWA">
            ⌥⌘O
          </MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarSub>
          <MenubarSubTrigger>{{ t('menu.export') }}</MenubarSubTrigger>
          <MenubarSubContent>
            <MenubarItem>{{ t('menu.export_current_workspace') }}</MenubarItem>
            <MenubarItem>{{ t('menu.export_all_workspaces') }}</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator />
        <MenubarItem>
          {{ t('menu.remove_tab') }} <MenubarShortcut v-if="isPWA">
            ⌘W
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          {{ t('menu.remove_workspace') }} <MenubarShortcut v-if="isPWA">
            ⇧⌘W
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger :disabled="disabled">
        View
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="toggleSidePanel">
          Toggle Sidebar <MenubarShortcut>⌘B</MenubarShortcut>
        </MenubarItem>
        <MenubarItem @click="toggleToolPanel">
          Toggle Tool Panel <MenubarShortcut v-if="isPWA">
            ⌘T
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger :disabled="disabled">
        Tools
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="sortJson">
          Sort JSON Keys <MenubarShortcut v-if="isPWA">
            ⇧⌘S
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

<style scoped lang="scss"></style>
