<script setup lang="ts">
import { editor, Uri } from 'monaco-editor'
import { shallowRef, watch } from 'vue'
import { useToolsStore } from '@/stores/tools'
import MonacoEditor from './base/MonacoEditor.vue'

const toolsStore = useToolsStore()

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
let model: editor.ITextModel | null = null

// Watch for external content changes (e.g., from Sort JSON)
watch(() => toolsStore.currentJsonContent, (newContent) => {
  if (model && model.getValue() !== newContent) {
    model.setValue(newContent)
  }
})

function onEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  EditorRef.value = _editor
  model = editor.createModel(
    toolsStore.currentJsonContent,
    'json',
    Uri.parse('internal://demiurge/workspace.json'),
  )
  _editor.setModel(model)
  _editor.onDidChangeModelContent(() => {
    const value = _editor.getValue()
    toolsStore.setCurrentJsonContent(value)
  })
}

function onEditorUnmounted() {
  if (model) {
    model.dispose()
  }
  if (EditorRef.value) {
    EditorRef.value.dispose()
  }
}
</script>

<template>
  <MonacoEditor
    :options="{
      formatOnType: true,
      formatOnPaste: true,
      tabSize: 2,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
    }"
    @mounted="onEditorMounted"
    @unmounted="onEditorUnmounted"
  />
</template>
