<script setup lang="ts">
import type { editor } from 'monaco-editor'
import { storeToRefs } from 'pinia'
import { shallowRef, watch } from 'vue'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToolsStore } from '@/stores/tools'

const toolsStore = useToolsStore()
const { playground } = storeToRefs(toolsStore)

function handleAutoRunChange(event: Event) {
  const target = event.target as HTMLInputElement
  toolsStore.setPlaygroundAutoRun(target.checked)
}

const expressionEditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const resultEditorRef = shallowRef<editor.IStandaloneCodeEditor>()

function handleModeChange(value: string | string[]) {
  if (typeof value === 'string' && (value === 'javascript' || value === 'jsonpath')) {
    toolsStore.setPlaygroundMode(value)
  }
}

function handleExecute() {
  toolsStore.executePlayground()
}

function onExpressionEditorMounted(_editor: editor.IStandaloneCodeEditor) {
  expressionEditorRef.value = _editor
  _editor.setValue(playground.value.expression)
  _editor.onDidChangeModelContent(() => {
    toolsStore.setPlaygroundExpression(_editor.getValue())
  })
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
</script>

<template>
  <div class="h-full flex flex-col gap-2">
    <!-- Mode Toggle + Execute Button -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <ToggleGroup
        type="single"
        :model-value="playground.mode"
        @update:model-value="handleModeChange"
      >
        <ToggleGroupItem value="javascript" class="text-xs px-2">
          JavaScript
        </ToggleGroupItem>
        <ToggleGroupItem value="jsonpath" class="text-xs px-2">
          JSONPath
        </ToggleGroupItem>
      </ToggleGroup>

      <Button
        size="sm"
        :disabled="playground.isExecuting || !playground.expression.trim()"
        @click="handleExecute"
      >
        <span v-if="playground.isExecuting" class="i-mingcute-loading-3-line animate-spin mr-1" />
        <span v-else class="i-mingcute-play-fill mr-1" />
        Run
      </Button>

      <Label class="flex items-center gap-1.5 text-xs cursor-pointer select-none ml-auto">
        <input
          type="checkbox"
          :checked="playground.autoRun"
          class="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
          @change="handleAutoRunChange"
        >
        Auto Run
      </Label>
    </div>

    <!-- Expression Editor (top half) -->
    <div class="flex-1 min-h-0 border rounded-md overflow-hidden">
      <div class="text-xs text-muted-foreground px-2 py-1 border-b bg-muted/50">
        <template v-if="playground.mode === 'javascript'">
          Expression (use <code class="font-mono bg-muted px-1 rounded">this</code> to access JSON)
        </template>
        <template v-else>
          JSONPath (e.g., <code class="font-mono bg-muted px-1 rounded">$.store.book[*].author</code>)
        </template>
      </div>
      <div class="h-[calc(100%-28px)]">
        <MonacoEditor
          :options="{
            language: playground.mode === 'javascript' ? 'javascript' : 'plaintext',
            minimap: { enabled: false },
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 13,
          }"
          @mounted="onExpressionEditorMounted"
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
          }"
          @mounted="onResultEditorMounted"
        />
      </div>
    </div>
  </div>
</template>
