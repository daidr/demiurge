<script setup lang="ts">
import type { editor } from 'monaco-editor'
import { useMonaco } from '@guolao/vue-monaco-editor'
import { onUnmounted, shallowRef, watch } from 'vue'
import { useToolsStore } from '@/stores/tools'
import MonacoEditor from './base/MonacoEditor.vue'
import PanelHeader from './base/PanelHeader.vue'
import FormatJsonButton from './tools/instant/FormatJsonButton.vue'
import SchemaEditorButton from './tools/instant/SchemaEditorButton.vue'
import SortJsonButton from './tools/instant/SortJsonButton.vue'

const toolsStore = useToolsStore()
const { monacoRef } = useMonaco()

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
let model: editor.ITextModel | null = null

// Watch for external content changes (e.g., from Sort JSON)
watch(() => toolsStore.currentJsonContent, (newContent) => {
  if (model && model.getValue() !== newContent) {
    model.setValue(newContent || '')
  }
})

// Watch for schema changes and apply to Monaco JSON validation
watch(() => toolsStore.currentJsonSchema, (newSchema) => {
  updateJsonSchemaValidation(newSchema)
})

function updateJsonSchemaValidation(schemaString: string) {
  const monaco = monacoRef.value
  if (!monaco)
    return

  // 获取 json 语言服务（使用 any 绕过类型问题，运行时 API 存在）

  const jsonDefaults = (monaco.languages as any).json?.jsonDefaults
  if (!jsonDefaults)
    return

  try {
    // Try to parse the schema to validate it's valid JSON
    if (schemaString.trim()) {
      const schema = JSON.parse(schemaString)

      jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'internal://demiurge/user-schema.json',
            fileMatch: ['workspace.json'],
            schema,
          },
        ],
      })
    }
    else {
      // No schema provided, use default validation

      jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [],
      })
    }
  }
  catch {
    // Invalid JSON schema, fall back to default validation

    jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [],
    })
  }
}

function onEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  const monaco = monacoRef.value
  if (!monaco)
    return

  EditorRef.value = _editor
  toolsStore.setEditorRef(_editor)
  model = monaco.editor.createModel(
    toolsStore.currentJsonContent,
    'json',
    monaco.Uri.parse('internal://demiurge/workspace.json'),
  )
  _editor.setModel(model)
  _editor.onDidChangeModelContent(() => {
    const value = _editor.getValue()
    toolsStore.setCurrentJsonContent(value)
  })

  // Apply schema if already set
  if (toolsStore.currentJsonSchema) {
    updateJsonSchemaValidation(toolsStore.currentJsonSchema)
  }
}

function onEditorUnmounted() {
  if (model) {
    model.dispose()
  }
  if (EditorRef.value) {
    EditorRef.value.dispose()
  }
  toolsStore.setEditorRef(null)
}

// Cleanup on component unmount
onUnmounted(() => {
  toolsStore.setEditorRef(null)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <PanelHeader title="JSON">
      <SchemaEditorButton />
      <FormatJsonButton />
      <SortJsonButton />
    </PanelHeader>
    <div class="flex-1 min-h-0">
      <MonacoEditor
        :options="{
          formatOnType: true,
          formatOnPaste: true,
          tabSize: 2,
          minimap: { enabled: true },
          scrollBeyondLastLine: true,
          fontSize: 14,
        }"
        @mounted="onEditorMounted"
        @unmounted="onEditorUnmounted"
      />
    </div>
  </div>
</template>
