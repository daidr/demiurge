<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type * as MonacoEditor from 'monaco-editor'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useResizeObserver, useThrottleFn } from '@vueuse/core'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useEditorTheme } from '@/composables/useEditorTheme'

const props = defineProps<{
  options?: editor.IStandaloneEditorConstructionOptions
  value?: string
}>()

const emit = defineEmits<{
  'mounted': [editor: editor.IStandaloneCodeEditor, monaco: typeof MonacoEditor]
  'unmounted': [editor.IStandaloneCodeEditor]
  'update:value': [string]
}>()

const { editorTheme } = useEditorTheme()

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const ContainerRef = ref<HTMLDivElement | null>(null)
const OverflowRef = ref<HTMLDivElement | null>(null)

// Optimized position tracking - only update on resize/scroll instead of continuous tracking
const position = ref({ x: 0, y: 0 })

const updatePosition = useThrottleFn(() => {
  if (ContainerRef.value) {
    const rect = ContainerRef.value.getBoundingClientRect()
    position.value = { x: rect.x, y: rect.y }
  }
}, 100)

// Watch for container resize
useResizeObserver(ContainerRef, updatePosition)

function handleEditorMount(editor: editor.IStandaloneCodeEditor, monaco: typeof MonacoEditor) {
  EditorRef.value = editor
  emit('mounted', editor, monaco)
}

function handleEditorUnmount() {
  if (EditorRef.value) {
    emit('unmounted', EditorRef.value)
  }
}

function handleValueChange(value: string | undefined) {
  emit('update:value', value ?? '')
}

const showEditor = ref(false)
onMounted(() => {
  showEditor.value = true
  updatePosition()
  // Listen for scroll and resize events
  window.addEventListener('scroll', updatePosition, { passive: true })
  window.addEventListener('resize', updatePosition, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="OverflowRef" class="monaco-editor-overflows monaco-editor w-full" :style="{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }"
    />
  </Teleport>
  <div ref="ContainerRef" class="h-full w-full">
    <VueMonacoEditor
      v-if="showEditor"
      class="h-full w-full"
      :value="props.value"
      :language="options?.language"
      :theme="editorTheme"
      :options="{
        ...options,
        automaticLayout: true,
        overflowWidgetsDomNode: OverflowRef ?? undefined,
      }"
      @update:value="handleValueChange"
      @mount="handleEditorMount"
      @before-unmount="handleEditorUnmount"
    />
  </div>
</template>

<style scoped>
.monaco-editor-overflows {
  @apply important-fixed top-0 left-0 z-99;
}
</style>
