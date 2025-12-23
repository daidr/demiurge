<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import AppLoadingScreen from '@/components/AppLoadingScreen.vue'
import ReloadPrompt from '@/components/ReloadPrompt.vue'
import { Toaster } from '@/components/ui/sonner'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { useInitI18n } from '@/composables/useInitI18n'
import 'vue-sonner/style.css'

type AppState = 'loading-db' | 'loading-workspace' | 'ready' | 'not-supported'

const appState = ref<AppState>('loading-db')

useInitI18n()

// Define lazy-loaded components
const MainApp = defineAsyncComponent(() => import('./components/MainApp.vue'))
const NotSupportApp = defineAsyncComponent(() => import('./NotSupportApp.vue'))

// Convert app state to loading screen stage
const loadingStage = ref<'db' | 'workspace' | 'ready'>('db')

async function initializeApp() {
  try {
    // Stage 1: Loading database
    appState.value = 'loading-db'
    loadingStage.value = 'db'

    if (!navigator?.storage?.getDirectory) {
      throw new Error('Browser does not support OPFS')
    }

    const { waitForCollectionsReady } = await import('./db')
    await waitForCollectionsReady()

    // Stage 2: Loading workspace
    appState.value = 'loading-workspace'
    loadingStage.value = 'workspace'

    // Small delay to show the stage transition
    // await new Promise(resolve => setTimeout(resolve, 100))

    // Stage 3: Ready
    loadingStage.value = 'ready'
    appState.value = 'ready'
  }
  catch (error) {
    console.error('Failed to initialize database:', error)
    appState.value = 'not-supported'
  }
}

onMounted(() => {
  initializeApp()
})

const hideLoadingScreen = ref(false)

function handleAppResolve() {
  hideLoadingScreen.value = true
}
</script>

<template>
  <TooltipProvider>
    <ReloadPrompt />
    <transition name="fade">
      <AppLoadingScreen v-if="!hideLoadingScreen" :stage="loadingStage" />
    </transition>
    <Suspense v-if="appState === 'not-supported'" @resolve="handleAppResolve">
      <NotSupportApp />
    </Suspense>
    <Suspense v-else-if="appState === 'ready'" @resolve="handleAppResolve">
      <MainApp />
    </Suspense>
    <Toaster />
  </TooltipProvider>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
