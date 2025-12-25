<script setup lang="ts">
import type { editor as monacoEditor } from 'monaco-editor'
import type { DiffChange, DiffResult } from '@/utils/tools_worker'
import { useDebounceFn, useMagicKeys, useVirtualList, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoDiffEditor from '@/components/base/MonacoDiffEditor.vue'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace'
import { getToolsWorker } from '@/utils/tools_service'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
})

const { t } = useI18n()

const workspaceStore = useWorkspaceStore()
const { sortedTabs } = storeToRefs(workspaceStore)

// Data source mode: 'tab' for tab selection, 'custom' for manual input
type SourceMode = 'tab' | 'custom'
const leftSourceMode = ref<SourceMode>('tab')
const rightSourceMode = ref<SourceMode>('tab')

// Selected tab IDs (for tab mode)
const leftTabId = ref<string | null>(null)
const rightTabId = ref<string | null>(null)

// Raw content for diff editor display (editable in custom mode)
const leftRawContent = ref('')
const rightRawContent = ref('')

// Formatted content for diff calculation (sorted JSON)
const leftFormattedContent = ref('')
const rightFormattedContent = ref('')

// Diff result
const diffResult = ref<DiffResult | null>(null)
const showDiffList = ref(true)

// Virtual list for diff changes
const diffChanges = computed(() => diffResult.value?.changes ?? [])
const { list: virtualChanges, containerProps, wrapperProps } = useVirtualList(diffChanges, {
  itemHeight: 46, // Each item is approximately 46px
})

// Get raw content for a tab
function getRawContent(tabId: string | null): string {
  if (!tabId)
    return ''
  const tab = sortedTabs.value.find(t => t.id === tabId)
  return tab?.content ?? ''
}

// Format JSON using worker (sort keys for consistent diff)
async function formatJson(content: string): Promise<string> {
  if (!content.trim())
    return ''
  const worker = await getToolsWorker()
  const result = await worker.sortJson(content)
  return result ?? content
}

// Calculate diff when both formatted contents are available
async function calculateDiff() {
  if (!leftFormattedContent.value || !rightFormattedContent.value) {
    diffResult.value = null
    return
  }
  const worker = await getToolsWorker()
  diffResult.value = await worker.calculateJsonDiff(leftFormattedContent.value, rightFormattedContent.value)
}

// Update left content based on source mode
async function updateLeftContent() {
  if (leftSourceMode.value === 'tab') {
    const raw = getRawContent(leftTabId.value)
    leftRawContent.value = raw
    leftFormattedContent.value = await formatJson(raw)
  }
  else {
    // In custom mode, raw content is edited directly by user
    leftFormattedContent.value = await formatJson(leftRawContent.value)
  }
}

// Update right content based on source mode
async function updateRightContent() {
  if (rightSourceMode.value === 'tab') {
    const raw = getRawContent(rightTabId.value)
    rightRawContent.value = raw
    rightFormattedContent.value = await formatJson(raw)
  }
  else {
    // In custom mode, raw content is edited directly by user
    rightFormattedContent.value = await formatJson(rightRawContent.value)
  }
}

// Debounced update for custom input changes
const debouncedUpdateLeftFormatted = useDebounceFn(async () => {
  leftFormattedContent.value = await formatJson(leftRawContent.value)
}, 300)

const debouncedUpdateRightFormatted = useDebounceFn(async () => {
  rightFormattedContent.value = await formatJson(rightRawContent.value)
}, 300)

// Handle editor content changes (from MonacoDiffEditor)
function handleLeftContentChange(value: string) {
  if (leftSourceMode.value === 'custom') {
    leftRawContent.value = value
    debouncedUpdateLeftFormatted()
  }
}

function handleRightContentChange(value: string) {
  if (rightSourceMode.value === 'custom') {
    rightRawContent.value = value
    debouncedUpdateRightFormatted()
  }
}

// Watch source mode changes
watch(leftSourceMode, (newMode, oldMode) => {
  if (newMode === 'custom' && oldMode === 'tab') {
    // Switching to custom mode - keep current content for editing
    // Content is already in leftRawContent
  }
  else {
    updateLeftContent()
  }
})

watch(rightSourceMode, (newMode, oldMode) => {
  if (newMode === 'custom' && oldMode === 'tab') {
    // Switching to custom mode - keep current content for editing
    // Content is already in rightRawContent
  }
  else {
    updateRightContent()
  }
})

// Watch tab selection changes
watch(leftTabId, () => {
  if (leftSourceMode.value === 'tab') {
    updateLeftContent()
  }
})

watch(rightTabId, () => {
  if (rightSourceMode.value === 'tab') {
    updateRightContent()
  }
})

// Recalculate diff when formatted content changes
watch([leftFormattedContent, rightFormattedContent], () => {
  calculateDiff()
})

// Monaco diff editor ref
const diffEditorRef = shallowRef<monacoEditor.IStandaloneDiffEditor>()

// Handle diff editor mount
function handleDiffEditorMount(editor: monacoEditor.IStandaloneDiffEditor) {
  diffEditorRef.value = editor
}

// Diff navigation - track current diff index
const currentDiffIndex = ref(-1)

function goToNextDiff() {
  if (!diffEditorRef.value)
    return

  const lineChanges = diffEditorRef.value.getLineChanges()
  if (!lineChanges || lineChanges.length === 0)
    return

  // Find next diff
  const modifiedEditor = diffEditorRef.value.getModifiedEditor()
  const currentLine = modifiedEditor.getPosition()?.lineNumber ?? 0

  // Find the next change after current position
  let nextIndex = lineChanges.findIndex(change =>
    (change.modifiedStartLineNumber ?? change.modifiedEndLineNumber) > currentLine,
  )

  if (nextIndex === -1) {
    // Wrap around to first change
    nextIndex = 0
  }

  const nextChange = lineChanges[nextIndex]
  if (nextChange) {
    const targetLine = nextChange.modifiedStartLineNumber || nextChange.modifiedEndLineNumber
    modifiedEditor.revealLineInCenter(targetLine)
    modifiedEditor.setPosition({ lineNumber: targetLine, column: 1 })
    modifiedEditor.focus()
    currentDiffIndex.value = nextIndex
  }
}

function goToPreviousDiff() {
  if (!diffEditorRef.value)
    return

  const lineChanges = diffEditorRef.value.getLineChanges()
  if (!lineChanges || lineChanges.length === 0)
    return

  const modifiedEditor = diffEditorRef.value.getModifiedEditor()
  const currentLine = modifiedEditor.getPosition()?.lineNumber ?? Infinity

  // Find the previous change before current position
  let prevIndex = -1
  for (let i = lineChanges.length - 1; i >= 0; i--) {
    const change = lineChanges[i]
    if (change && (change.modifiedStartLineNumber ?? change.modifiedEndLineNumber) < currentLine) {
      prevIndex = i
      break
    }
  }

  if (prevIndex === -1) {
    // Wrap around to last change
    prevIndex = lineChanges.length - 1
  }

  const prevChange = lineChanges[prevIndex]
  if (prevChange) {
    const targetLine = prevChange.modifiedStartLineNumber || prevChange.modifiedEndLineNumber
    modifiedEditor.revealLineInCenter(targetLine)
    modifiedEditor.setPosition({ lineNumber: targetLine, column: 1 })
    modifiedEditor.focus()
    currentDiffIndex.value = prevIndex
  }
}

// Navigate to a specific change in the editor
function goToChange(change: DiffChange) {
  if (!diffEditorRef.value)
    return

  // Determine which editor to search in based on change type
  // For 'removed', search in original (left) editor; for others, search in modified (right)
  const editor = change.type === 'removed'
    ? diffEditorRef.value.getOriginalEditor()
    : diffEditorRef.value.getModifiedEditor()

  const model = editor.getModel()
  if (!model)
    return

  // Get the value to search for
  const valueToFind = change.type === 'removed' ? change.oldValue : change.newValue

  // Try to find by searching for the actual value in the JSON
  // This works better for array elements and primitive values
  let searchPattern: string | null = null
  let matches: ReturnType<typeof model.findMatches> = []

  // For primitive values, search for the value itself
  if (valueToFind !== undefined && valueToFind !== null && typeof valueToFind !== 'object') {
    const valueStr = JSON.stringify(valueToFind)
    // Search for the exact value (handles strings, numbers, booleans)
    searchPattern = valueStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    matches = model.findMatches(searchPattern, true, true, true, null, true)
  }

  // If no matches found or value is an object, try finding by key
  if (matches.length === 0) {
    // Parse path segments, handling both dot notation and bracket notation
    // e.g., $.foo.bar["baz:qux"][0] -> ["$", "foo", "bar", "baz:qux", "0"]
    const pathSegments: string[] = []
    const pathRegex = /\["([^"]+)"\]|\[(\d+)\]|\.([^.[\]]+)|(\$)/g
    for (const pathMatch of change.path.matchAll(pathRegex)) {
      // Group 1: bracket notation with quotes ["key"]
      // Group 2: array index [0]
      // Group 3: dot notation .key
      // Group 4: root $
      const segment = pathMatch[1] ?? pathMatch[2] ?? pathMatch[3] ?? pathMatch[4]
      if (segment)
        pathSegments.push(segment)
    }

    // Find the last non-numeric segment (the key name)
    let keySegment: string | null = null
    for (let i = pathSegments.length - 1; i >= 0; i--) {
      const seg = pathSegments[i]
      if (seg && seg !== '$' && !/^\d+$/.test(seg)) {
        keySegment = seg
        break
      }
    }

    if (keySegment) {
      // Search for the key (escape special regex chars in the key)
      const escapedKey = keySegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      searchPattern = `"${escapedKey}"\\s*:`
      matches = model.findMatches(searchPattern, true, true, false, null, true)
    }
  }

  // If still no matches and it's a root-level array change, search for array bracket
  if (matches.length === 0 && change.path.match(/^\$\[\d+\]$/)) {
    // For root array elements, just go to the beginning
    editor.setPosition({ lineNumber: 1, column: 1 })
    editor.revealLineInCenter(1)
    editor.focus()
    return
  }

  const match = matches[0]
  if (match) {
    editor.setSelection(match.range)
    editor.revealLineInCenter(match.range.startLineNumber)
    editor.focus()
  }
}

// Keyboard shortcuts for diff navigation (only when window is open)
const keys = useMagicKeys()
whenever(() => isOpen.value && keys.F8?.value, () => {
  goToNextDiff()
})
whenever(() => isOpen.value && keys['Shift+F8']?.value, () => {
  goToPreviousDiff()
})

// Format and sort JSON for custom input mode
async function formatAndSortLeft() {
  if (leftSourceMode.value === 'custom' && leftRawContent.value) {
    const worker = await getToolsWorker()
    const sorted = await worker.sortJson(leftRawContent.value)
    if (sorted) {
      leftRawContent.value = sorted
    }
  }
}

async function formatAndSortRight() {
  if (rightSourceMode.value === 'custom' && rightRawContent.value) {
    const worker = await getToolsWorker()
    const sorted = await worker.sortJson(rightRawContent.value)
    if (sorted) {
      rightRawContent.value = sorted
    }
  }
}

// Format value for display
function formatValue(value: unknown): string {
  if (value === undefined)
    return 'undefined'
  if (typeof value === 'string') {
    const truncated = value.length > 30 ? `${value.slice(0, 30)}...` : value
    return JSON.stringify(truncated)
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    }
    return `Object(${Object.keys(value).length})`
  }
  return JSON.stringify(value)
}

// Get icon for change type
function getChangeIcon(type: DiffChange['type']): string {
  switch (type) {
    case 'added': return 'i-mingcute-add-line'
    case 'removed': return 'i-mingcute-delete-2-line'
    case 'modified': return 'i-mingcute-edit-2-line'
    case 'type_changed': return 'i-mingcute-transfer-line'
    default: return 'i-mingcute-question-line'
  }
}

// Get color class for change type
function getChangeColorClass(type: DiffChange['type']): string {
  switch (type) {
    case 'added': return 'text-green-600 dark:text-green-400'
    case 'removed': return 'text-red-600 dark:text-red-400'
    case 'modified': return 'text-amber-600 dark:text-amber-400'
    case 'type_changed': return 'text-purple-600 dark:text-purple-400'
    default: return 'text-muted-foreground'
  }
}

// Get background class for change type
function getChangeBgClass(type: DiffChange['type']): string {
  switch (type) {
    case 'added': return 'bg-green-500/10 hover:bg-green-500/20'
    case 'removed': return 'bg-red-500/10 hover:bg-red-500/20'
    case 'modified': return 'bg-amber-500/10 hover:bg-amber-500/20'
    case 'type_changed': return 'bg-purple-500/10 hover:bg-purple-500/20'
    default: return 'bg-muted/50 hover:bg-muted'
  }
}

// Reset state when window closes
watch(isOpen, (open) => {
  if (!open) {
    leftSourceMode.value = 'tab'
    rightSourceMode.value = 'tab'
    leftTabId.value = null
    rightTabId.value = null
    leftRawContent.value = ''
    rightRawContent.value = ''
    leftFormattedContent.value = ''
    rightFormattedContent.value = ''
    diffResult.value = null
    diffEditorRef.value = undefined
  }
})
</script>

<template>
  <FloatingWindow
    v-model="isOpen" :title="t('diff.title')" :initial-width="1100" :initial-height="650" :min-width="700"
    :min-height="400"
  >
    <template #toolbar>
      <div class="flex flex-1 items-center gap-4">
        <!-- Left source selector -->
        <div class="flex flex-1 items-center gap-2">
          <Label class="text-muted-foreground shrink-0 text-xs">{{ t('diff.left_tab') }}</Label>
          <!-- Source mode toggle -->
          <div class="border-border flex h-6 shrink-0 overflow-hidden rounded-md border">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="flex items-center justify-center px-1.5 text-xs transition-colors"
                  :class="leftSourceMode === 'tab' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  @click="leftSourceMode = 'tab'"
                >
                  <span class="i-mingcute-file-line size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ t('diff.from_tab') }}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="border-border flex items-center justify-center border-l px-1.5 text-xs transition-colors"
                  :class="leftSourceMode === 'custom' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  @click="leftSourceMode = 'custom'"
                >
                  <span class="i-mingcute-edit-line size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ t('diff.custom_input') }}
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Format and sort button (only in custom mode) -->
          <Tooltip v-if="leftSourceMode === 'custom'">
            <TooltipTrigger as-child>
              <button
                class="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded transition-colors"
                @click="formatAndSortLeft"
              >
                <span class="i-mingcute-sort-ascending-line size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ t('diff.format_and_sort') }}
            </TooltipContent>
          </Tooltip>
          <!-- Tab selector (only in tab mode) -->
          <Select v-if="leftSourceMode === 'tab'" v-model="leftTabId">
            <SelectTrigger class="h-6 flex-1 text-xs">
              <SelectValue :placeholder="t('diff.select_tab')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tab in sortedTabs" :key="tab.id" :value="tab.id">
                {{ tab.title }}
              </SelectItem>
            </SelectContent>
          </Select>
          <!-- Custom mode indicator -->
          <span v-else class="text-muted-foreground flex-1 truncate text-xs">
            {{ t('diff.edit_directly') }}
          </span>
        </div>

        <!-- Right source selector -->
        <div class="flex flex-1 items-center gap-2">
          <Label class="text-muted-foreground shrink-0 text-xs">{{ t('diff.right_tab') }}</Label>
          <!-- Source mode toggle -->
          <div class="border-border flex h-6 shrink-0 overflow-hidden rounded-md border">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="flex items-center justify-center px-1.5 text-xs transition-colors"
                  :class="rightSourceMode === 'tab' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  @click="rightSourceMode = 'tab'"
                >
                  <span class="i-mingcute-file-line size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ t('diff.from_tab') }}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="border-border flex items-center justify-center border-l px-1.5 text-xs transition-colors"
                  :class="rightSourceMode === 'custom' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  @click="rightSourceMode = 'custom'"
                >
                  <span class="i-mingcute-edit-line size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {{ t('diff.custom_input') }}
              </TooltipContent>
            </Tooltip>
          </div>
          <!-- Format and sort button (only in custom mode) -->
          <Tooltip v-if="rightSourceMode === 'custom'">
            <TooltipTrigger as-child>
              <button
                class="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded transition-colors"
                @click="formatAndSortRight"
              >
                <span class="i-mingcute-sort-ascending-line size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ t('diff.format_and_sort') }}
            </TooltipContent>
          </Tooltip>
          <!-- Tab selector (only in tab mode) -->
          <Select v-if="rightSourceMode === 'tab'" v-model="rightTabId">
            <SelectTrigger class="h-6 flex-1 text-xs">
              <SelectValue :placeholder="t('diff.select_tab')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tab in sortedTabs" :key="tab.id" :value="tab.id">
                {{ tab.title }}
              </SelectItem>
            </SelectContent>
          </Select>
          <!-- Custom mode indicator -->
          <span v-else class="text-muted-foreground flex-1 truncate text-xs">
            {{ t('diff.edit_directly') }}
          </span>
        </div>

        <!-- Navigation buttons -->
        <div class="border-border flex h-6 items-center gap-0.5 rounded-md border px-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 flex size-5 items-center justify-center rounded transition-colors disabled:cursor-not-allowed"
                :disabled="!diffResult?.stats.total" @click="goToPreviousDiff"
              >
                <span class="i-mingcute-up-line size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ t('diff.prev_diff') }} (Shift+F8)
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 flex size-5 items-center justify-center rounded transition-colors disabled:cursor-not-allowed"
                :disabled="!diffResult?.stats.total" @click="goToNextDiff"
              >
                <span class="i-mingcute-down-line size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ t('diff.next_diff') }} (F8)
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- Toggle diff list button -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded transition-colors"
              :class="{ 'text-foreground bg-muted': showDiffList }" @click="showDiffList = !showDiffList"
            >
              <span class="i-mingcute-list-check-line size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ t('diff.toggle_list') }}
          </TooltipContent>
        </Tooltip>
      </div>
    </template>

    <div class="flex h-full">
      <!-- Monaco Diff Editor -->
      <div class="min-w-0 flex-1">
        <MonacoDiffEditor
          v-if="isOpen" :original="leftRawContent" :modified="rightRawContent"
          :original-editable="leftSourceMode === 'custom'" :modified-editable="rightSourceMode === 'custom'"
          language="json" :options="{
            renderSideBySide: true,
            useInlineViewWhenSpaceIsLimited: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
          }" @mounted="handleDiffEditorMount" @update:original="handleLeftContentChange"
          @update:modified="handleRightContentChange"
        />
      </div>

      <!-- Diff List Panel -->
      <div v-if="showDiffList" class="border-border bg-background flex h-full w-64 shrink-0 flex-col border-l">
        <!-- Stats Header -->
        <div class="border-border flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
          <span
            v-if="diffResult?.stats.added"
            class="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600 dark:text-green-400"
          >
            <span class="i-mingcute-add-line size-3" />
            {{ diffResult.stats.added }}
          </span>
          <span
            v-if="diffResult?.stats.removed"
            class="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-600 dark:text-red-400"
          >
            <span class="i-mingcute-delete-2-line size-3" />
            {{ diffResult.stats.removed }}
          </span>
          <span
            v-if="diffResult?.stats.modified"
            class="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400"
          >
            <span class="i-mingcute-edit-2-line size-3" />
            {{ diffResult.stats.modified }}
          </span>
          <span
            v-if="diffResult?.stats.typeChanged"
            class="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-xs text-purple-600 dark:text-purple-400"
          >
            <span class="i-mingcute-transfer-line size-3" />
            {{ diffResult.stats.typeChanged }}
          </span>
          <span v-if="diffResult?.stats.total === 0" class="text-muted-foreground text-xs">
            {{ t('diff.no_changes') }}
          </span>
          <span
            v-if="!diffResult && leftFormattedContent && rightFormattedContent"
            class="text-muted-foreground text-xs"
          >
            {{ t('diff.calculating') }}
          </span>
          <span v-if="!leftFormattedContent || !rightFormattedContent" class="text-muted-foreground text-xs">
            {{ t('diff.select_tabs_hint') }}
          </span>
        </div>

        <!-- Changes List (Virtual Scroll) -->
        <div v-if="diffChanges.length" v-bind="containerProps" class="flex-1">
          <div v-bind="wrapperProps">
            <Tooltip v-for="{ data: change, index } in virtualChanges" :key="index">
              <TooltipTrigger as-child>
                <button
                  class="flex h-11 w-full items-start gap-2 px-3 py-1.5 text-left transition-colors"
                  :class="getChangeBgClass(change.type)" @click="goToChange(change)"
                >
                  <span
                    class="mt-0.5 size-3.5 shrink-0"
                    :class="[getChangeIcon(change.type), getChangeColorClass(change.type)]"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-mono text-xs">
                      {{ change.path }}
                    </div>
                    <div class="text-muted-foreground mt-0.5 truncate text-xs">
                      <template v-if="change.type === 'added'">
                        {{ formatValue(change.newValue) }}
                      </template>
                      <template v-else-if="change.type === 'removed'">
                        {{ formatValue(change.oldValue) }}
                      </template>
                      <template v-else-if="change.type === 'modified'">
                        {{ formatValue(change.oldValue) }} → {{ formatValue(change.newValue) }}
                      </template>
                      <template v-else-if="change.type === 'type_changed'">
                        {{ change.oldType }} → {{ change.newType }}
                      </template>
                    </div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="8" class="max-h-80 w-80 overflow-auto p-0">
                <div class="space-y-2 p-3">
                  <div class="break-all font-mono text-xs font-medium">
                    {{ change.path }}
                  </div>
                  <!-- Added -->
                  <div v-if="change.type === 'added'" class="space-y-1">
                    <span class="text-muted-foreground text-xs">{{ t('diff.new_value') }}:</span>
                    <pre class="bg-secondary text-secondary-foreground max-h-32 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.newValue, null, 2) }}</code></pre>
                  </div>
                  <!-- Removed -->
                  <div v-else-if="change.type === 'removed'" class="space-y-1">
                    <span class="text-muted-foreground text-xs">{{ t('diff.old_value') }}:</span>
                    <pre class="bg-secondary text-secondary-foreground max-h-32 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.oldValue, null, 2) }}</code></pre>
                  </div>
                  <!-- Modified -->
                  <div v-else-if="change.type === 'modified'" class="space-y-2">
                    <div class="space-y-1">
                      <span class="text-muted-foreground text-xs">{{ t('diff.old_value') }}:</span>
                      <pre class="bg-secondary text-secondary-foreground max-h-24 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.oldValue, null, 2) }}</code></pre>
                    </div>
                    <div class="space-y-1">
                      <span class="text-muted-foreground text-xs">{{ t('diff.new_value') }}:</span>
                      <pre class="bg-secondary text-secondary-foreground max-h-24 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.newValue, null, 2) }}</code></pre>
                    </div>
                  </div>
                  <!-- Type Changed -->
                  <div v-else-if="change.type === 'type_changed'" class="space-y-2">
                    <div class="text-xs">
                      {{ t('diff.type_change') }}: <code class="bg-secondary text-secondary-foreground rounded px-1">{{ change.oldType }}</code> →
                      <code class="bg-secondary text-secondary-foreground rounded px-1">{{ change.newType }}</code>
                    </div>
                    <div class="space-y-1">
                      <span class="text-muted-foreground text-xs">{{ t('diff.old_value') }}:</span>
                      <pre class="bg-secondary text-secondary-foreground max-h-24 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.oldValue, null, 2) }}</code></pre>
                    </div>
                    <div class="space-y-1">
                      <span class="text-muted-foreground text-xs">{{ t('diff.new_value') }}:</span>
                      <pre class="bg-secondary text-secondary-foreground max-h-24 overflow-auto rounded border p-2"><code class="text-xs">{{ JSON.stringify(change.newValue, null, 2) }}</code></pre>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </FloatingWindow>
</template>
