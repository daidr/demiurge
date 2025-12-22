<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type * as MonacoEditor from 'monaco-editor'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useElementBounding } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

const props = defineProps<{
  options?: editor.IStandaloneEditorConstructionOptions
  value?: string
}>()

const emit = defineEmits<{
  'mounted': [editor: editor.IStandaloneCodeEditor, monaco: typeof MonacoEditor]
  'unmounted': [editor.IStandaloneCodeEditor]
  'update:value': [string]
}>()

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const ContainerRef = ref<HTMLDivElement | null>(null)
const OverflowRef = ref<HTMLDivElement | null>(null)
const { x, y } = useElementBounding(ContainerRef)

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
</script>

<template>
  <Teleport to="body">
    <div
      ref="OverflowRef" class="monaco-editor-overflows monaco-editor w-full" :style="{
        transform: `translate(${x}px, ${y}px)`,
      }"
    />
  </Teleport>
  <div ref="ContainerRef" class="h-full w-full">
    <VueMonacoEditor
      class="h-full w-full"
      :value="props.value"
      :language="options?.language"
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
