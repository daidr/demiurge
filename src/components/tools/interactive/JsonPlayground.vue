<script setup lang="ts">
import type { editor, IDisposable } from 'monaco-editor'
import type { AcceptableValue } from 'reka-ui'
import { typescript } from 'monaco-editor'
import { storeToRefs } from 'pinia'
import { onUnmounted, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const toolsStore = useToolsStore()
const {
  playground,
  playgroundMode,
  playgroundExpression,
  playgroundAutoRun,
  currentJsonContent,
} = storeToRefs(toolsStore)

// Track the extra lib disposable for cleanup
let extraLibDisposable: IDisposable | null = null

function handleAutoRunChange(checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate')
    return
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
  if (playgroundMode.value !== 'javascript') {
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
  _editor.setValue(playgroundExpression.value)
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

// Watch expression changes to sync to editor
watch(playgroundExpression, (newExpr) => {
  if (expressionEditorRef.value && expressionEditorRef.value.getValue() !== newExpr) {
    expressionEditorRef.value.setValue(newExpr)
  }
})

watch(() => [playground.value.result, playground.value.error], updateResultEditor)

// Watch for JSON content changes to update type definitions
watch(currentJsonContent, updateTypeDefinitions)

// Watch for mode changes to update type definitions
watch(playgroundMode, updateTypeDefinitions)

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
    <div class="flex flex-shrink-0 items-center gap-2">
      <ToggleGroup type="single" :model-value="playgroundMode" @update:model-value="handleModeChange">
        <ToggleGroupItem value="javascript" class="px-2 text-xs">
          JavaScript
        </ToggleGroupItem>
        <ToggleGroupItem value="jsonpath" class="px-2 text-xs">
          JSONPath
        </ToggleGroupItem>
      </ToggleGroup>

      <Button size="xs" :disabled="playground.isExecuting || !playgroundExpression.trim()" @click="handleExecute">
        <span v-if="playground.isExecuting" class="i-mingcute-loading-3-line mr-1 animate-spin" />
        <span v-else class="i-mingcute-play-fill mr-1" />
        {{ t('tools.run') }}
      </Button>

      <Label class="ml-auto flex cursor-pointer select-none items-center gap-1.5 text-xs">
        <Checkbox :model-value="playgroundAutoRun" @update:model-value="handleAutoRunChange" />
        {{ t('tools.auto_run') }}
      </Label>
    </div>

    <!-- Expression Editor (top half) -->
    <div class="min-h-0 flex-1 overflow-hidden rounded-md border">
      <div class="text-muted-foreground bg-muted/50 border-b px-2 py-1 text-xs">
        <template v-if="playgroundMode === 'javascript'">
          <i18n-t keypath="tools.expression_hint_js" tag="span">
            <template #dollar>
              <code class="bg-muted rounded px-1 font-mono">$</code>
            </template>
            <template #data>
              <code class="bg-muted rounded px-1 font-mono">data</code>
            </template>
          </i18n-t>
        </template>
        <template v-else>
          <i18n-t keypath="tools.expression_hint_jsonpath" tag="span">
            <template #example>
              <code class="bg-muted rounded px-1 font-mono">$.store.book[*].author</code>
            </template>
          </i18n-t>
        </template>
      </div>
      <div class="h-[calc(100%-28px)]">
        <MonacoEditor
          :options="{
            language: playgroundMode === 'javascript' ? 'javascript' : 'jsonpath',
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
    <div class="min-h-0 flex-1 overflow-hidden rounded-md border">
      <div class="text-muted-foreground bg-muted/50 flex items-center gap-1 border-b px-2 py-1 text-xs">
        <span v-if="playground.error" class="i-mingcute-close-circle-line text-destructive" />
        <span v-else class="i-mingcute-check-circle-line text-green-600" />
        {{ t('tools.result') }}
        <span v-if="playground.executionTime !== null" class="text-muted-foreground/70 ml-auto">
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
