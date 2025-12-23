<script setup lang="ts">
import { ref } from 'vue'
import { configureJsonSchemaValidation } from '@/composables/useMonacoJsonSchema'
import { useMonacoModel } from '@/composables/useMonacoModel'
import MonacoEditor from './base/MonacoEditor.vue'

const code = ref('')

// Use Monaco model composable
const {
  handleEditorMounted,
  handleEditorUnmounted,
} = useMonacoModel({
  content: code,
  language: 'json',
  uri: 'internal://demiurge/json-schema.json',
  onContentChange: (value) => {
    code.value = value
  },
  onMounted: (_editor, monaco) => {
    // Configure JSON Schema validation for the schema editor itself
    configureJsonSchemaValidation(monaco)
  },
})
</script>

<template>
  <MonacoEditor
    :options="{
      formatOnType: true,
      formatOnPaste: true,
      placeholder: $t('editor.json-schema.placeholder'),
    }" @mounted="handleEditorMounted" @unmounted="handleEditorUnmounted"
  />
</template>

<style scoped>
.monaco-editor-overflows {
  @apply important-fixed top-0 left-0 z-99;
}
</style>
