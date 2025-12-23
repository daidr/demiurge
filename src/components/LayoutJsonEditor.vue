<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useMonacoJsonSchema } from '@/composables/useMonacoJsonSchema'
import { useMonacoModel } from '@/composables/useMonacoModel'
import { useToolsStore } from '@/stores/tools'
import MonacoEditor from './base/MonacoEditor.vue'
import PanelHeader from './base/PanelHeader.vue'
import FormatJsonButton from './tools/instant/FormatJsonButton.vue'
import SchemaEditorButton from './tools/instant/SchemaEditorButton.vue'
import SortJsonButton from './tools/instant/SortJsonButton.vue'

const toolsStore = useToolsStore()

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
  onMounted: (editor) => {
    toolsStore.setEditorRef(editor)
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
        @mounted="handleEditorMounted"
        @unmounted="handleEditorUnmounted"
      />
    </div>
  </div>
</template>
