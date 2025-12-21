<script setup lang="ts">
import type { editor as monacoEditor } from 'monaco-editor'
import { editor, json, Uri } from 'monaco-editor'
import { storeToRefs } from 'pinia'
import { ref, shallowRef, watch } from 'vue'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import { Button } from '@/components/ui/button'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToolsStore } from '@/stores/tools'

// Configure JSON schema validation for the schema editor
json.jsonDefaults.setDiagnosticsOptions({
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

const toolsStore = useToolsStore()
const { currentJsonSchema } = storeToRefs(toolsStore)

const isOpen = ref(false)
const EditorRef = shallowRef<monacoEditor.IStandaloneCodeEditor>()
let model: monacoEditor.ITextModel | null = null

// Sync store schema to editor
watch(currentJsonSchema, (newSchema) => {
  if (model && model.getValue() !== newSchema) {
    model.setValue(newSchema)
  }
})

function openModal() {
  isOpen.value = true
}

function onEditorMounted(_editor: monacoEditor.IStandaloneCodeEditor) {
  EditorRef.value = _editor
  model = editor.createModel(
    currentJsonSchema.value,
    'json',
    Uri.parse('internal://demiurge/json-schema.json'),
  )
  _editor.setModel(model)
  _editor.onDidChangeModelContent(() => {
    toolsStore.setCurrentJsonSchema(_editor.getValue())
  })
}

function onEditorUnmounted() {
  if (model) {
    model.dispose()
    model = null
  }
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="w-7 h-7" @click="openModal">
          <span class="i-mingcute-file-check-line text-base" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>JSON Schema Editor</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <FloatingWindow
    v-model="isOpen"
    title="JSON Schema Editor"
    :initial-width="600"
    :initial-height="500"
    :min-width="400"
    :min-height="300"
  >
    <MonacoEditor
      :options="{
        formatOnType: true,
        formatOnPaste: true,
      }"
      @mounted="onEditorMounted"
      @unmounted="onEditorUnmounted"
    />
  </FloatingWindow>
</template>
