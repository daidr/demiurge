<script setup lang="ts">
import hotkeys from 'hotkeys-js'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AboutDialog from '@/components/AboutDialog.vue'
import DiffWindow from '@/components/DiffWindow.vue'
import SettingWindow from '@/components/SettingWindow.vue'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import LogoMenubarTrigger from '@/components/ui/menubar/LogoMenubarTrigger.vue'
import WorkspaceCreateDialog from '@/components/WorkspaceCreateDialog.vue'
import WorkspaceDeleteDialog from '@/components/WorkspaceDeleteDialog.vue'
import { useLayoutStore } from '@/stores/layout'
import { useSettingsStore } from '@/stores/settings'
import { useWorkspaceStore } from '@/stores/workspace'
import { tryFormatJson } from '@/utils/json'
import { isMac } from '@/utils/platform'

defineProps<{
  disabled?: boolean
}>()
// Shortcut key symbols based on platform
const modKey = isMac() ? '⌘' : 'Ctrl+'
const shiftKey = isMac() ? '⇧' : 'Shift+'
const altKey = isMac() ? '⌥' : 'Alt+'

const { t } = useI18n()
const layoutStore = useLayoutStore()
const settingsStore = useSettingsStore()
const workspaceStore = useWorkspaceStore()
const { activeWorkspaceId, activeTabId, activeWorkspace, hasActiveTab, sortedTabs } = storeToRefs(workspaceStore)
const { settings } = storeToRefs(settingsStore)

// Whether tab-related menu items should be disabled (no workspace selected)
const isTabMenuDisabled = computed(() => !activeWorkspaceId.value)

// Whether remove tab should be disabled (no tab selected)
const isRemoveTabDisabled = computed(() => !activeTabId.value)

// Whether tool panel toggle should be disabled (no active tab)
const isToolPanelDisabled = computed(() => !hasActiveTab.value)

// Whether remove workspace should be disabled (no workspace selected)
const isRemoveWorkspaceDisabled = computed(() => !activeWorkspaceId.value)

// Whether diff menu should be disabled (no workspace or no tabs)
const isDiffDisabled = computed(() => !activeWorkspaceId.value || sortedTabs.value.length === 0)

// Active workspace title for delete dialog
const activeWorkspaceTitle = computed(() => activeWorkspace.value?.title ?? '')

// Check if running as installed PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: window-controls-overlay)').matches
  || (navigator as any).standalone === true

// Dialog state for new workspace
const showNewWorkspaceDialog = ref(false)

const showAboutDialog = ref(false)

// SettingWindow state
const showSettingWindow = ref(false)

// DiffWindow state
const showDiffWindow = ref(false)

// Menubar open state (controlled by v-model)
const openMenu = ref('')

// Track Alt key state for showing access key hints
const isAltPressed = ref(false)

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Alt') {
    isAltPressed.value = true
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === 'Alt') {
    isAltPressed.value = false
  }
}

// Functions to open specific menus via hotkey
function openFileMenu() {
  openMenu.value = 'file'
}

function openViewMenu() {
  openMenu.value = 'view'
}

function openToolsMenu() {
  openMenu.value = 'tools'
}

function toggleSidePanel() {
  layoutStore.toggleSidebar()
}

function toggleToolPanel() {
  layoutStore.toggleToolPanel()
}

function getDefaultTabOptions() {
  return {
    activeToolTab: settings.value.defaultToolTab,
    sizeViewerMode: settings.value.defaultSizeViewerMode,
    playgroundMode: settings.value.defaultPlaygroundMode,
    playgroundAutoRun: settings.value.defaultPlaygroundAutoRun,
  }
}

function handleNewTab() {
  if (!activeWorkspaceId.value)
    return
  const tabId = workspaceStore.createTab(activeWorkspaceId.value, t('tab.untitled'), getDefaultTabOptions())
  workspaceStore.setActiveTab(tabId)
}

async function handleNewTabFromClipboard() {
  if (!activeWorkspaceId.value)
    return

  try {
    let text = await navigator.clipboard.readText()
    // Auto format if enabled and valid JSON
    if (settings.value.autoFormatOnPaste) {
      text = tryFormatJson(text)
    }
    // Format timestamp as MM-DD/HH:mm:ss
    const now = new Date()
    const timestamp = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}/${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const tabTitle = t('tab.from_clipboard', { timestamp })
    const tabId = workspaceStore.createTab(activeWorkspaceId.value, tabTitle, getDefaultTabOptions())
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
    let content = await file.text()
    // Auto format if enabled and valid JSON
    if (settings.value.autoFormatOnPaste) {
      content = tryFormatJson(content)
    }
    // Use file name without extension as tab title
    const fileName = file.name.replace(/\.json$/i, '') || t('tab.untitled')
    const tabId = workspaceStore.createTab(activeWorkspaceId.value, fileName, getDefaultTabOptions())
    workspaceStore.setActiveTab(tabId)
    workspaceStore.updateTabContent(tabId, content)
  }
  catch {
    // User cancelled or file read error
  }
}

// Delete workspace dialog state
const showDeleteWorkspaceDialog = ref(false)

function handleRemoveTab() {
  if (!activeTabId.value)
    return
  workspaceStore.deleteTab(activeTabId.value)
}

function handleRemoveWorkspace() {
  if (!activeWorkspaceId.value)
    return
  showDeleteWorkspaceDialog.value = true
}

onMounted(() => {
  // Toggle sidebar is always available (not affected by PWA mode)
  hotkeys('command+b, ctrl+b', (e) => {
    e.preventDefault()
    toggleSidePanel()
  })

  // Preferences hotkey - always available
  hotkeys('command+,, ctrl+,', (e) => {
    e.preventDefault()
    showSettingWindow.value = true
  })

  // Other hotkeys only available in PWA mode
  if (!isPWA)
    return

  // Track Alt key for access key hints
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', () => {
    isAltPressed.value = false
  })

  hotkeys('command+t, ctrl+t', (e) => {
    e.preventDefault()
    toggleToolPanel()
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
  hotkeys('command+w, ctrl+w', (e) => {
    e.preventDefault()
    handleRemoveTab()
    return false
  })
  hotkeys('command+shift+w, ctrl+shift+w', (e) => {
    e.preventDefault()
    handleRemoveWorkspace()
    return false
  })

  // Alt+F/V/T to open menus (PWA only)
  hotkeys('alt+f', (e) => {
    e.preventDefault()
    openFileMenu()
    return false
  })
  hotkeys('alt+v', (e) => {
    e.preventDefault()
    openViewMenu()
    return false
  })
  hotkeys('alt+t', (e) => {
    e.preventDefault()
    openToolsMenu()
    return false
  })
})

onUnmounted(() => {
  // Toggle sidebar is always registered
  hotkeys.unbind('command+b, ctrl+b')
  // Preferences hotkey is always registered
  hotkeys.unbind('command+,, ctrl+,')

  if (!isPWA)
    return

  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)

  hotkeys.unbind('command+t, ctrl+t')
  hotkeys.unbind('command+shift+n, ctrl+shift+n')
  hotkeys.unbind('command+n, ctrl+n')
  hotkeys.unbind('command+alt+n, ctrl+alt+n')
  hotkeys.unbind('command+alt+o, ctrl+alt+o')
  hotkeys.unbind('command+w, ctrl+w')
  hotkeys.unbind('command+shift+w, ctrl+shift+w')
  hotkeys.unbind('alt+f')
  hotkeys.unbind('alt+v')
  hotkeys.unbind('alt+t')
})
</script>

<template>
  <Menubar v-model="openMenu">
    <MenubarMenu value="logo">
      <LogoMenubarTrigger />
      <MenubarContent>
        <MenubarItem @click="showSettingWindow = true">
          {{ t('menu.preferences') }} <MenubarShortcut>{{ modKey }},</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem @click="showAboutDialog = true">
          {{ t('menu.about') }}
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <AboutDialog v-model:open="showAboutDialog" />
    <SettingWindow v-model="showSettingWindow" />
    <WorkspaceCreateDialog v-model:open="showNewWorkspaceDialog" />
    <WorkspaceDeleteDialog
      v-model:open="showDeleteWorkspaceDialog"
      :workspace-id="activeWorkspaceId"
      :workspace-title="activeWorkspaceTitle"
    />
    <MenubarMenu v-if="!disabled" value="file">
      <MenubarTrigger>
        {{ t('menu.file') }}<template v-if="isPWA">
          (<span :class="{ underline: isAltPressed }">F</span>)
        </template>
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="showNewWorkspaceDialog = true">
          {{ t('menu.new_workspace') }} <MenubarShortcut v-if="isPWA">
            {{ shiftKey }}{{ modKey }}N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTab">
          {{ t('menu.new_tab') }} <MenubarShortcut v-if="isPWA">
            {{ modKey }}N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTabFromClipboard">
          {{ t('menu.new_tab_from_clipboard') }} <MenubarShortcut v-if="isPWA">
            {{ altKey }}{{ modKey }}N
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isTabMenuDisabled" @click="handleNewTabFromFile">
          {{ t('menu.new_tab_from_file') }} <MenubarShortcut v-if="isPWA">
            {{ altKey }}{{ modKey }}O
          </MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <!-- <MenubarSub>
          <MenubarSubTrigger>{{ t('menu.export') }}</MenubarSubTrigger>
          <MenubarSubContent>
            <MenubarItem>{{ t('menu.export_current_workspace') }}</MenubarItem>
            <MenubarItem>{{ t('menu.export_all_workspaces') }}</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator /> -->
        <MenubarItem :disabled="isRemoveTabDisabled" @click="handleRemoveTab">
          {{ t('menu.remove_tab') }} <MenubarShortcut v-if="isPWA">
            {{ modKey }}W
          </MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isRemoveWorkspaceDisabled" @click="handleRemoveWorkspace">
          {{ t('menu.remove_workspace') }} <MenubarShortcut v-if="isPWA">
            {{ shiftKey }}{{ modKey }}W
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled" value="view">
      <MenubarTrigger :disabled="disabled">
        {{ t('menu.view') }}<template v-if="isPWA">
          (<span :class="{ underline: isAltPressed }">V</span>)
        </template>
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="toggleSidePanel">
          {{ t('menu.toggle_sidebar') }} <MenubarShortcut>{{ modKey }}B</MenubarShortcut>
        </MenubarItem>
        <MenubarItem :disabled="isToolPanelDisabled" @click="toggleToolPanel">
          {{ t('menu.toggle_tool_panel') }} <MenubarShortcut v-if="isPWA">
            {{ modKey }}T
          </MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled" value="tools">
      <MenubarTrigger>
        {{ t('menu.tools') }}<template v-if="isPWA">
          (<span :class="{ underline: isAltPressed }">T</span>)
        </template>
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem :disabled="isDiffDisabled" @click="showDiffWindow = true">
          {{ t('menu.json_diff') }}
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <DiffWindow v-model="showDiffWindow" />
  </Menubar>
</template>

<style scoped lang="scss"></style>
