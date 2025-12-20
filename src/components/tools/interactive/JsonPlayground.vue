<script setup lang="ts">
import type { editor, IDisposable } from 'monaco-editor'
import type { AcceptableValue } from 'reka-ui'
import { typescript } from 'monaco-editor'
import { storeToRefs } from 'pinia'
import { onUnmounted, shallowRef, watch } from 'vue'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToolsStore } from '@/stores/tools'
import { generateThisTypeDeclaration } from '@/utils/jsonToType'
import { registerJsonPathLanguage } from '@/utils/monaco-jsonpath'

// Register JSONPath language for syntax highlighting
registerJsonPathLanguage()

const toolsStore = useToolsStore()
const { playground, currentJsonContent } = storeToRefs(toolsStore)

// Track the extra lib disposable for cleanup
let extraLibDisposable: IDisposable | null = null

function handleAutoRunChange(checked: boolean) {
  toolsStore.setPlaygroundAutoRun(checked)
}

const expressionEditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const resultEditorRef = shallowRef<editor.IStandaloneCodeEditor>()

function handleModeChange(value: AcceptableValue) {
  if (typeof value === 'string' && (value === 'javascript' || value === 'jsonpath')) {
    toolsStore.setPlaygroundMode(value)
  }
}

function handleExecute() {
  toolsStore.executePlayground()
}

// Update TypeScript type definitions for `this` based on current JSON
function updateTypeDefinitions() {
  if (playground.value.mode !== 'javascript') {
    return
  }

  // Dispose previous extra lib
  if (extraLibDisposable) {
    extraLibDisposable.dispose()
    extraLibDisposable = null
  }

  const jsonContent = currentJsonContent.value
  if (!jsonContent.trim()) {
    return
  }

  const typeDeclaration = generateThisTypeDeclaration(jsonContent)
  if (typeDeclaration) {
    // Add type definitions for TypeScript/JavaScript language service
    extraLibDisposable = typescript.javascriptDefaults.addExtraLib(
      typeDeclaration,
      'ts:json-context.d.ts',
    )
  }
}

function onExpressionEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  expressionEditorRef.value = _editor
  _editor.setValue(playground.value.expression)
  _editor.onDidChangeModelContent(() => {
    toolsStore.setPlaygroundExpression(_editor.getValue())
  })

  // Initial type definitions update
  updateTypeDefinitions()
}

function onResultEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  resultEditorRef.value = _editor
}

// Update result editor when result changes
function updateResultEditor() {
  if (resultEditorRef.value) {
    const content = playground.value.error || playground.value.result || ''
    resultEditorRef.value.setValue(content)
  }
}

watch(() => [playground.value.result, playground.value.error], updateResultEditor)

// Watch for JSON content changes to update type definitions
watch(currentJsonContent, updateTypeDefinitions)

// Watch for mode changes to update type definitions
watch(() => playground.value.mode, updateTypeDefinitions)

// Cleanup on unmount
onUnmounted(() => {
  if (extraLibDisposable) {
    extraLibDisposable.dispose()
    extraLibDisposable = null
  }
})
</script>

<template>
  <div class="h-full flex flex-col gap-2">
    <!-- Mode Toggle + Execute Button -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <ToggleGroup type="single" :model-value="playground.mode" @update:model-value="handleModeChange">
        <ToggleGroupItem value="javascript" class="text-xs px-2">
          JavaScript
        </ToggleGroupItem>
        <ToggleGroupItem value="jsonpath" class="text-xs px-2">
          JSONPath
        </ToggleGroupItem>
      </ToggleGroup>

      <Button size="sm" :disabled="playground.isExecuting || !playground.expression.trim()" @click="handleExecute">
        <span v-if="playground.isExecuting" class="i-mingcute-loading-3-line animate-spin mr-1" />
        <span v-else class="i-mingcute-play-fill mr-1" />
        Run
      </Button>

      <Label class="flex items-center gap-1.5 text-xs cursor-pointer select-none ml-auto">
        <Checkbox
          :checked="playground.autoRun"
          @update:checked="handleAutoRunChange"
        />
        Auto Run
      </Label>
    </div>

    <!-- Expression Editor (top half) -->
    <div class="flex-1 min-h-0 border rounded-md overflow-hidden">
      <div class="text-xs text-muted-foreground px-2 py-1 border-b bg-muted/50">
        <template v-if="playground.mode === 'javascript'">
          Expression (use <code class="font-mono bg-muted px-1 rounded">$</code> or <code
            class="font-mono bg-muted px-1 rounded"
          >data</code> to access JSON)
        </template>
        <template v-else>
          JSONPath (e.g., <code class="font-mono bg-muted px-1 rounded">$.store.book[*].author</code>)
        </template>
      </div>
      <div class="h-[calc(100%-28px)]">
        <MonacoEditor
          :options="{
            language: playground.mode === 'javascript' ? 'javascript' : 'jsonpath',
            minimap: { enabled: false },
            lineNumbers: 'off',
            scrollBeyondLastLine: true,
            wordWrap: 'on',
            fontSize: 13,
          }" @mounted="onExpressionEditorMounted"
        />
      </div>
    </div>

    <!-- Result/Error Display (bottom half) -->
    <div class="flex-1 min-h-0 border rounded-md overflow-hidden">
      <div class="text-xs text-muted-foreground px-2 py-1 border-b bg-muted/50 flex items-center gap-1">
        <span v-if="playground.error" class="i-mingcute-close-circle-line text-destructive" />
        <span v-else class="i-mingcute-check-circle-line text-green-600" />
        Result
        <span v-if="playground.executionTime !== null" class="ml-auto text-muted-foreground/70">
          {{ playground.executionTime.toFixed(1) }} ms
        </span>
      </div>
      <div class="h-[calc(100%-28px)]">
        <MonacoEditor
          :options="{
            language: 'json',
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 13,
          }" @mounted="onResultEditorMounted"
        />
      </div>
    </div>
  </div>
</template>
