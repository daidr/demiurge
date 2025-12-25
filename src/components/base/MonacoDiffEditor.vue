<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type * as MonacoEditor from 'monaco-editor'
import { VueMonacoDiffEditor } from '@guolao/vue-monaco-editor'
import { useElementBounding } from '@vueuse/core'
import { onMounted, ref, shallowRef, watch } from 'vue'
import { useEditorTheme } from '@/composables/useEditorTheme'

const props = defineProps<{
  options?: editor.IStandaloneDiffEditorConstructionOptions
  original?: string
  modified?: string
  language?: string
  /** Whether the original (left) editor is editable */
  originalEditable?: boolean
  /** Whether the modified (right) editor is editable */
  modifiedEditable?: boolean
}>()

const emit = defineEmits<{
  'mounted': [editor: editor.IStandaloneDiffEditor, monaco: typeof MonacoEditor]
  'unmounted': [editor: editor.IStandaloneDiffEditor]
  'update:original': [value: string]
  'update:modified': [value: string]
}>()

const { editorTheme } = useEditorTheme()

const EditorRef = shallowRef<editor.IStandaloneDiffEditor>()
const ContainerRef = ref<HTMLDivElement | null>(null)
const OverflowRef = ref<HTMLDivElement | null>(null)
const { x, y } = useElementBounding(ContainerRef)

function handleEditorMount(diffEditor: editor.IStandaloneDiffEditor, monaco: typeof MonacoEditor) {
  EditorRef.value = diffEditor

  // Set up content change listeners for two-way binding
  const originalEditor = diffEditor.getOriginalEditor()
  const modifiedEditor = diffEditor.getModifiedEditor()

  originalEditor.onDidChangeModelContent(() => {
    if (props.originalEditable) {
      const value = originalEditor.getValue()
      emit('update:original', value)
    }
  })

  modifiedEditor.onDidChangeModelContent(() => {
    if (props.modifiedEditable) {
      const value = modifiedEditor.getValue()
      emit('update:modified', value)
    }
  })

  emit('mounted', diffEditor, monaco)
}

function handleEditorUnmount() {
  if (EditorRef.value) {
    emit('unmounted', EditorRef.value)
  }
}

// Watch for editable state changes and update editor options
watch(() => props.originalEditable, (editable) => {
  if (EditorRef.value) {
    const originalEditor = EditorRef.value.getOriginalEditor()
    originalEditor.updateOptions({ readOnly: !editable })
  }
})

watch(() => props.modifiedEditable, (editable) => {
  if (EditorRef.value) {
    const modifiedEditor = EditorRef.value.getModifiedEditor()
    modifiedEditor.updateOptions({ readOnly: !editable })
  }
})

const showEditor = ref(false)
onMounted(() => {
  showEditor.value = true
})
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
    <VueMonacoDiffEditor
      v-if="showEditor" class="h-full w-full" :original="props.original" :modified="props.modified"
      :language="props.language" :theme="editorTheme" :options="{
        ...options,
        automaticLayout: true,
        overflowWidgetsDomNode: OverflowRef ?? undefined,
      }" @mount="handleEditorMount" @before-unmount="handleEditorUnmount"
    />
  </div>
</template>

<style scoped>
.monaco-editor-overflows {
  @apply important-fixed top-0 left-0 z-99;
}
</style>
