<script setup lang="ts">
import { Uri, editor, languages } from 'monaco-editor'
import {
  ref,
  shallowRef,
  watch,
} from 'vue'
import MonacoEditor from './base/MonacoEditor.vue'

languages.json.jsonDefaults.setDiagnosticsOptions({
  schemas: [{
    uri: 'http://json-schema.org/draft-07/schema',
    fileMatch: ['json-schema.json'],
  }],
  enableSchemaRequest: true,
  allowComments: true,
  schemaValidation: 'error',
  validate: true,
})

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
let model: editor.ITextModel | null = null
const code = ref('')

watch(code, (newCode) => {
  if (model && model.getValue() !== newCode) {
    model.setValue(newCode)
  }
})

function onEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  EditorRef.value = _editor
  model = editor.createModel(code.value, 'json', Uri.parse('internal://json-baker/json-schema.json'))
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
