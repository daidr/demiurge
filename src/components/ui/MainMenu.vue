<script setup lang="ts">
import hotkeys from 'hotkeys-js'
import { onMounted, onUnmounted } from 'vue'
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
import { useLayoutStore } from '@/stores/layout'
import { useToolsStore } from '@/stores/tools'

defineProps<{
  disabled?: boolean
}>()

const layoutStore = useLayoutStore()
const toolsStore = useToolsStore()

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

onMounted(() => {
  hotkeys('command+b, ctrl+b', (e) => {
    e.preventDefault()
    toggleSidePanel()
  })
  hotkeys('command+t, ctrl+t', (e) => {
    e.preventDefault()
    toggleToolPanel()
  })
  hotkeys('command+shift+s, ctrl+shift+s', (e) => {
    e.preventDefault()
    sortJson()
  })
})

onUnmounted(() => {
  hotkeys.unbind('command+b, ctrl+b')
  hotkeys.unbind('command+t, ctrl+t')
  hotkeys.unbind('command+shift+s, ctrl+shift+s')
})
</script>

<template>
  <Menubar>
    <MenubarMenu>
      <LogoMenubarTrigger />
      <MenubarContent>
        <MenubarItem>
          Preferences <MenubarShortcut>⌘,</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          About
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          New Workspace <MenubarShortcut>⌘T</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          New Tab <MenubarShortcut>⌘N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          New Tab from Clipboard <MenubarShortcut>⌥⌘N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          New Snippet <MenubarShortcut>⇧⌘N</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarSub>
          <MenubarSubTrigger>Export</MenubarSubTrigger>
          <MenubarSubContent>
            <MenubarItem>Current Workspace</MenubarItem>
            <MenubarItem>All Workspaces</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator />
        <MenubarItem>
          Remove Tab <MenubarShortcut>⌘W</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Remove Workspace <MenubarShortcut>⇧⌘W</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger :disabled="disabled">
        View
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          Toggle Fullscreen <MenubarShortcut>⌘⌥F</MenubarShortcut>
        </MenubarItem>
        <MenubarItem @click="toggleSidePanel">
          Toggle Sidebar <MenubarShortcut>⌘B</MenubarShortcut>
        </MenubarItem>
        <MenubarItem @click="toggleToolPanel">
          Toggle Tool Panel <MenubarShortcut>⌘T</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu v-if="!disabled">
      <MenubarTrigger :disabled="disabled">
        Tools
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="sortJson">
          Sort JSON Keys <MenubarShortcut>⇧⌘S</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

<style scoped lang="scss"></style>
