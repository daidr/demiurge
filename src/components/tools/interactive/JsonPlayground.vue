<script setup lang="ts">
import type { editor, IDisposable } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import type { PlaygroundMode } from '@/db'
import { storeToRefs } from 'pinia'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui'
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PlaygroundModeToggle } from '@/components/ui/toggle-group'
import { useToolsStore } from '@/stores/tools'
import { generateThisTypeDeclaration } from '@/utils/jsonToType'
import { registerJsonPathLanguage } from '@/utils/monaco-jsonpath'
import SnippetButton from './SnippetButton.vue'

const monacoRef = shallowRef<typeof Monaco>()
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

// Computed value for result editor
const resultContent = computed(() => playground.value.error || playground.value.result || '')

function handleModeChange(value: PlaygroundMode) {
  toolsStore.setPlaygroundMode(value)
}

function handleExecute() {
  toolsStore.executePlayground()
}

function handleExpressionChange(value: string) {
  toolsStore.setPlaygroundExpression(value)
}

// Update TypeScript type definitions for `this` based on current JSON
function updateTypeDefinitions() {
  const monaco = monacoRef.value
  if (!monaco || playgroundMode.value !== 'javascript') {
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

    extraLibDisposable = (monaco.languages as any).typescript?.javascriptDefaults?.addExtraLib(
      typeDeclaration,
      'ts:json-context.d.ts',
    )
  }
}

function onExpressionEditorMounted(_editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) {
  monacoRef.value = monaco

  // Register JSONPath language for syntax highlighting
  registerJsonPathLanguage(monaco)

  // Initial type definitions update
  updateTypeDefinitions()
}

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
      <SnippetButton />

      <PlaygroundModeToggle
        :model-value="playgroundMode"
        :show-icon="false"
        @update:model-value="handleModeChange"
      />

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

    <!-- Splitter for Expression and Result panels -->
    <SplitterGroup direction="vertical" class="min-h-0 flex-1">
      <!-- Expression Editor Panel -->
      <SplitterPanel :min-size="20" :default-size="50">
        <div class="h-full overflow-hidden rounded-md border">
          <div class="text-muted-foreground bg-muted/50 border-b px-2 py-1 text-xs flex items-center gap-1">
            <span :class="playgroundMode === 'javascript' ? 'i-mingcute-code-line' : 'i-mingcute-route-line'" />
            <span class="font-medium">{{ t('tools.expression') }}</span>
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
              :value="playgroundExpression"
              :options="{
                language: playgroundMode === 'javascript' ? 'javascript' : 'jsonpath',
                minimap: { enabled: false },
                lineNumbers: 'off',
                scrollBeyondLastLine: true,
                wordWrap: 'on',
                fontSize: 13,
              }"
              @update:value="handleExpressionChange"
              @mounted="onExpressionEditorMounted"
            />
          </div>
        </div>
      </SplitterPanel>

      <!-- Resize Handle -->
      <SplitterResizeHandle class="splitter-handle" />

      <!-- Result/Error Display Panel -->
      <SplitterPanel :min-size="20" :default-size="50" class="min-h-[200px]">
        <div class="h-full overflow-hidden rounded-md border">
          <div class="text-muted-foreground bg-muted/50 flex items-center gap-1 border-b px-2 py-1 text-xs">
            <span v-if="playground.error" class="i-mingcute-close-circle-line text-destructive" />
            <span v-else class="i-mingcute-check-circle-line text-green-600 dark:text-green-500" />
            <span class="font-medium">{{ t('tools.result') }}</span>
            <span v-if="playground.executionTime !== null" class="text-muted-foreground/70 ml-auto">
              {{ playground.executionTime.toFixed(1) }} ms
            </span>
          </div>
          <div class="h-[calc(100%-28px)]">
            <MonacoEditor
              :value="resultContent"
              :options="{
                language: 'json',
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 13,
              }"
            />
          </div>
        </div>
      </SplitterPanel>
    </SplitterGroup>
  </div>
</template>

<style scoped>
.splitter-handle {
  @apply relative h-2 w-full flex items-center justify-center transition-colors;
}

.splitter-handle::before {
  content: '';
  @apply absolute left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-border transition-colors;
}

.splitter-handle:hover::before,
.splitter-handle[data-state="drag"]::before {
  @apply bg-primary;
}
</style>
