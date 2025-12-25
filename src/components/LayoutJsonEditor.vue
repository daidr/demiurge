<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type { JsonPathSegment } from '@/utils/positionToJsonPath'
import { computed, onUnmounted, ref } from 'vue'
import { useMonacoJsonSchema } from '@/composables/useMonacoJsonSchema'
import { useMonacoModel } from '@/composables/useMonacoModel'
import { useToolsStore } from '@/stores/tools'
import { getJsonPathAtPosition } from '@/utils/positionToJsonPath'
import JsonPathBreadcrumb from './base/JsonPathBreadcrumb.vue'
import MonacoEditor from './base/MonacoEditor.vue'
import PanelHeader from './base/PanelHeader.vue'
import FormatJsonButton from './tools/instant/FormatJsonButton.vue'
import SchemaEditorButton from './tools/instant/SchemaEditorButton.vue'
import SortJsonButton from './tools/instant/SortJsonButton.vue'

const toolsStore = useToolsStore()

// Breadcrumb state
const breadcrumbSegments = ref<JsonPathSegment[]>([])
const breadcrumbJsonPath = ref('$')

// Cursor position change handler
let cursorDisposable: ReturnType<editor.IStandaloneCodeEditor['onDidChangeCursorPosition']> | null = null

function updateBreadcrumb(editorInstance: editor.IStandaloneCodeEditor) {
  const position = editorInstance.getPosition()
  if (!position)
    return

  const content = toolsStore.currentJsonContent
  if (!content) {
    breadcrumbSegments.value = []
    breadcrumbJsonPath.value = '$'
    return
  }

  const result = getJsonPathAtPosition(content, position.lineNumber, position.column)
  if (result) {
    breadcrumbSegments.value = result.segments
    breadcrumbJsonPath.value = result.jsonPath
  }
  else {
    breadcrumbSegments.value = []
    breadcrumbJsonPath.value = '$'
  }
}

function handleBreadcrumbNavigate(path: string) {
  toolsStore.navigateToJsonPath(path)
}

// Use Monaco model composable
const {
  monacoRef,
  handleEditorMounted,
  handleEditorUnmounted,
} = useMonacoModel({
  content: computed(() => toolsStore.currentJsonContent),
  language: 'json',
  uri: 'internal://demiurge/workspace.json',
  onContentChange: (value) => {
    toolsStore.setCurrentJsonContent(value)
  },
  onMounted: (editorInstance) => {
    toolsStore.setEditorRef(editorInstance)
    // Subscribe to cursor position changes
    cursorDisposable = editorInstance.onDidChangeCursorPosition(() => {
      updateBreadcrumb(editorInstance)
    })
    // Initial breadcrumb update
    updateBreadcrumb(editorInstance)
  },
  onUnmounted: () => {
    toolsStore.setEditorRef(null)
  },
})

// Use Monaco JSON schema composable
useMonacoJsonSchema({
  monacoRef,
  schema: computed(() => toolsStore.currentJsonSchema),
  fileMatch: ['workspace.json'],
})

// Cleanup on component unmount
onUnmounted(() => {
  cursorDisposable?.dispose()
  cursorDisposable = null
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
    <JsonPathBreadcrumb
      :segments="breadcrumbSegments"
      :json-path="breadcrumbJsonPath"
      @navigate="handleBreadcrumbNavigate"
    />
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
        @mounted="handleEditorMounted"
        @unmounted="handleEditorUnmounted"
      />
    </div>
  </div>
</template>
