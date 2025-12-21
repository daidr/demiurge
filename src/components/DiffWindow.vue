<script setup lang="ts">
import type { editor as monacoEditor } from 'monaco-editor'
import { useMonaco } from '@guolao/vue-monaco-editor'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onUnmounted, ref, shallowRef, watch } from 'vue'
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
const { monacoRef, unload } = useMonaco()

const workspaceStore = useWorkspaceStore()
const { sortedTabs } = storeToRefs(workspaceStore)

// Selected tab IDs
const leftTabId = ref<string | null>(null)
const rightTabId = ref<string | null>(null)

// Sort JSON keys recursively
function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {}
    Object.keys(obj as Record<string, unknown>).sort().forEach((key) => {
      sorted[key] = sortJsonKeys((obj as Record<string, unknown>)[key])
    })
    return sorted
  }
  return obj
}

// Format and sort JSON content
function formatJson(content: string): string {
  if (!content.trim())
    return ''
  try {
    const parsed = JSON.parse(content)
    const sorted = sortJsonKeys(parsed)
    return JSON.stringify(sorted, null, 2)
  }
  catch {
    return content
  }
}

// Get formatted content for left tab
const leftContent = computed(() => {
  const tab = sortedTabs.value.find(t => t.id === leftTabId.value)
  return tab ? formatJson(tab.content) : ''
})

// Get formatted content for right tab
const rightContent = computed(() => {
  const tab = sortedTabs.value.find(t => t.id === rightTabId.value)
  return tab ? formatJson(tab.content) : ''
})

// Monaco diff editor ref
const containerRef = ref<HTMLDivElement>()
const diffEditorRef = shallowRef<monacoEditor.IStandaloneDiffEditor>()
let originalModel: monacoEditor.ITextModel | null = null
let modifiedModel: monacoEditor.ITextModel | null = null

// Initialize diff editor when container is ready and window is open
const stop = watch([() => containerRef.value, () => isOpen.value, () => monacoRef.value], async ([container, open, monaco]) => {
  if (container && open && monaco) {
    nextTick(() => stop())

    // Create models
    originalModel = monaco.editor.createModel('', 'json')
    modifiedModel = monaco.editor.createModel('', 'json')

    // Create diff editor
    diffEditorRef.value = monaco.editor.createDiffEditor(container, {
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
    })

    diffEditorRef.value.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    // Update content
    originalModel.setValue(leftContent.value)
    modifiedModel.setValue(rightContent.value)
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

// Cleanup when window closes
watch(isOpen, (open) => {
  if (!open) {
    leftTabId.value = null
    rightTabId.value = null
  }
})

onUnmounted(() => {
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
  unload()
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
