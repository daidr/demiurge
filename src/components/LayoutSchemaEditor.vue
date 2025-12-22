<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import { ref, shallowRef, watch } from 'vue'
import MonacoEditor from './base/MonacoEditor.vue'

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const monacoRef = shallowRef<typeof Monaco>()
let model: editor.ITextModel | null = null
const code = ref('')

watch(code, (newCode) => {
  if (model && model.getValue() !== newCode) {
    model.setValue(newCode || '')
  }
})

function configureJsonSchemaValidation() {
  const monaco = monacoRef.value
  if (!monaco)
    return

  const jsonDefaults = (monaco.languages as any).json?.jsonDefaults
  if (!jsonDefaults)
    return

  jsonDefaults.setDiagnosticsOptions({
    schemas: [
      {
        uri: 'http://json-schema.org/draft-07/schema',
        fileMatch: ['json-schema.json'],
      },
    ],
    enableSchemaRequest: true,
    allowComments: true,
    schemaValidation: 'error',
    validate: true,
  })
}

function onEditorMounted(_editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) {
  monacoRef.value = monaco
  configureJsonSchemaValidation()

  EditorRef.value = _editor
  model = monaco.editor.createModel(
    code.value,
    'json',
    monaco.Uri.parse('internal://demiurge/json-schema.json'),
  )
  _editor.setModel(model)
  _editor.onDidChangeModelContent(() => {
    code.value = _editor.getValue()
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
      placeholder: $t('editor.json-schema.placeholder'),
    }" @mounted="onEditorMounted" @unmounted="onEditorUnmounted"
  />
</template>

<style scoped>
.monaco-editor-overflows {
  @apply important-fixed top-0 left-0 z-99;
}
</style>
