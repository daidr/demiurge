<script setup lang="ts">
import type { editor as monacoEditor } from 'monaco-editor'
import { useMonaco } from '@guolao/vue-monaco-editor'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
const { monacoRef } = useMonaco()

const workspaceStore = useWorkspaceStore()
const { sortedTabs } = storeToRefs(workspaceStore)

// Selected tab IDs
const leftTabId = ref<string | null>(null)
const rightTabId = ref<string | null>(null)

// Formatted content (async from worker)
const leftContent = ref('')
const rightContent = ref('')

// Get raw content for a tab
function getRawContent(tabId: string | null): string {
  if (!tabId)
    return ''
  const tab = sortedTabs.value.find(t => t.id === tabId)
  return tab?.content ?? ''
}

// Format JSON using worker
async function formatJson(content: string): Promise<string> {
  if (!content.trim())
    return ''
  const worker = await getToolsWorker()
  const result = await worker.sortJson(content)
  return result ?? content
}

// Update left content when tab changes
watch(leftTabId, async (tabId) => {
  const raw = getRawContent(tabId)
  leftContent.value = await formatJson(raw)
})

// Update right content when tab changes
watch(rightTabId, async (tabId) => {
  const raw = getRawContent(tabId)
  rightContent.value = await formatJson(raw)
})

// Monaco diff editor ref
const containerRef = ref<HTMLDivElement>()
const diffEditorRef = shallowRef<monacoEditor.IStandaloneDiffEditor>()
let originalModel: monacoEditor.ITextModel | null = null
let modifiedModel: monacoEditor.ITextModel | null = null

// Cleanup function for Monaco resources
function disposeMonaco() {
  if (diffEditorRef.value) {
    diffEditorRef.value.dispose()
    diffEditorRef.value = undefined
  }
  if (originalModel) {
    originalModel.dispose()
    originalModel = null
  }
  if (modifiedModel) {
    modifiedModel.dispose()
    modifiedModel = null
  }
}

// Initialize Monaco when window opens
function initMonaco() {
  const container = containerRef.value
  const monaco = monacoRef.value
  if (!container || !monaco)
    return

  // Create models
  originalModel = monaco.editor.createModel('', 'json')
  modifiedModel = monaco.editor.createModel('', 'json')

  // Create diff editor
  diffEditorRef.value = monaco.editor.createDiffEditor(container, {
    automaticLayout: true,
    readOnly: true,
    renderSideBySide: true,
    useInlineViewWhenSpaceIsLimited: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
  })

  diffEditorRef.value.setModel({
    original: originalModel,
    modified: modifiedModel,
  })

  // Set initial content
  originalModel.setValue(leftContent.value)
  modifiedModel.setValue(rightContent.value)
}

// Watch for window open/close to manage Monaco lifecycle
watch(isOpen, async (open) => {
  if (open) {
    // Wait for container to be rendered, then init Monaco
    await nextTick()
    initMonaco()
  }
  else {
    // Reset state and cleanup Monaco
    leftTabId.value = null
    rightTabId.value = null
    leftContent.value = ''
    rightContent.value = ''
    disposeMonaco()
  }
})

// Also watch for monaco to become available after window opens
watch(monacoRef, (monaco) => {
  if (monaco && isOpen.value && !diffEditorRef.value) {
    initMonaco()
  }
})

// Update models when content changes
watch(leftContent, (content) => {
  if (originalModel) {
    originalModel.setValue(content)
  }
})

watch(rightContent, (content) => {
  if (modifiedModel) {
    modifiedModel.setValue(content)
  }
})
</script>

<template>
  <FloatingWindow
    v-model="isOpen" :title="t('diff.title')" :initial-width="900" :initial-height="600" :min-width="600"
    :min-height="400"
  >
    <template #toolbar>
      <div class="flex flex-1 items-center gap-4">
        <!-- Left tab selector -->
        <div class="flex flex-1 items-center gap-2">
          <Label class="text-muted-foreground shrink-0 text-xs">{{ t('diff.left_tab') }}</Label>
          <Select v-model="leftTabId">
            <SelectTrigger class="h-6 flex-1 text-xs">
              <SelectValue :placeholder="t('diff.select_tab')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tab in sortedTabs" :key="tab.id" :value="tab.id">
                {{ tab.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Right tab selector -->
        <div class="flex flex-1 items-center gap-2">
          <Label class="text-muted-foreground shrink-0 text-xs">{{ t('diff.right_tab') }}</Label>
          <Select v-model="rightTabId">
            <SelectTrigger class="h-6 flex-1 text-xs">
              <SelectValue :placeholder="t('diff.select_tab')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tab in sortedTabs" :key="tab.id" :value="tab.id">
                {{ tab.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </template>

    <!-- Monaco Diff Editor container -->
    <div ref="containerRef" class="size-full" :class="{ 'is-loading': !diffEditorRef }" />
  </FloatingWindow>
</template>

<style scoped>
.is-loading {
  position: relative;
}

.is-loading::after {
  content: 'loading...';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
