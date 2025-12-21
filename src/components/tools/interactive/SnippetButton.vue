<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import type { PlaygroundMode } from '@/db'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSnippetStore } from '@/stores/snippet'
import { useToolsStore } from '@/stores/tools'

const { t } = useI18n()
const snippetStore = useSnippetStore()
const toolsStore = useToolsStore()
const { snippets, selectedSnippetId, selectedSnippet, isEditMode } = storeToRefs(snippetStore)

const isOpen = ref(false)

// Local state for editing
const localName = ref('')
const localMode = ref<PlaygroundMode>('javascript')
const localContent = ref('')

// Sync local state when selected snippet changes
watch(selectedSnippet, (snippet) => {
  if (snippet) {
    localName.value = snippet.name
    localMode.value = snippet.mode
    localContent.value = snippet.content
  }
  else {
    localName.value = ''
    localMode.value = 'javascript'
    localContent.value = ''
  }
}, { immediate: true })

// Editor options based on edit mode
const editorOptions = computed(() => ({
  language: localMode.value === 'javascript' ? 'javascript' : 'jsonpath',
  minimap: { enabled: false },
  lineNumbers: 'off' as const,
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  fontSize: 13,
  readOnly: !isEditMode.value || !selectedSnippetId.value,
}))

function openSnippetWindow() {
  isOpen.value = true
}

function handleSelectSnippet(id: string) {
  // Before switching, check if current snippet name is empty and fallback to default
  if (selectedSnippetId.value && isEditMode.value && !localName.value.trim()) {
    const defaultName = t('snippet.untitled')
    snippetStore.updateSnippet(selectedSnippetId.value, { name: defaultName })
  }
  snippetStore.setSelectedSnippet(id)
  snippetStore.setEditMode(false)
}

function handleCreateSnippet() {
  const id = snippetStore.createSnippet(t('snippet.untitled'))
  snippetStore.setSelectedSnippet(id)
  snippetStore.setEditMode(true)
}

function handleDeleteSnippet() {
  if (selectedSnippetId.value) {
    snippetStore.deleteSnippet(selectedSnippetId.value)
  }
}

function handleEditModeChange(checked: boolean) {
  // When exiting edit mode, check if name is empty and fallback to default
  if (!checked && selectedSnippetId.value && !localName.value.trim()) {
    const defaultName = t('snippet.untitled')
    localName.value = defaultName
    snippetStore.updateSnippet(selectedSnippetId.value, { name: defaultName })
  }
  snippetStore.setEditMode(checked)
}

function handleNameBlur() {
  if (selectedSnippetId.value && isEditMode.value) {
    const name = localName.value.trim() || t('snippet.untitled')
    localName.value = name
    snippetStore.updateSnippet(selectedSnippetId.value, { name })
  }
}

function handleModeChange(value: AcceptableValue) {
  if (typeof value === 'string' && (value === 'javascript' || value === 'jsonpath')) {
    localMode.value = value
    if (selectedSnippetId.value && isEditMode.value) {
      snippetStore.updateSnippet(selectedSnippetId.value, { mode: value })
    }
  }
}

function handleContentChange(value: string) {
  localContent.value = value
  if (selectedSnippetId.value && isEditMode.value) {
    snippetStore.updateSnippet(selectedSnippetId.value, { content: value })
  }
}

function handleApply() {
  if (selectedSnippet.value) {
    toolsStore.setPlaygroundMode(selectedSnippet.value.mode)
    toolsStore.setPlaygroundExpression(selectedSnippet.value.content)
    isOpen.value = false
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  // Less than 24 hours ago, show time
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  // Less than 7 days ago, show day of week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }
  // Otherwise show date
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <!-- Snippet Button -->
  <BaseTooltip :text="t('snippet.title')">
    <Button size="xs" variant="ghost" @click="openSnippetWindow">
      <span class="i-mingcute-paper-line" />
    </Button>
  </BaseTooltip>

  <FloatingWindow
    v-model="isOpen"
    :title="t('snippet.title')"
    :initial-width="700"
    :initial-height="500"
    :min-width="550"
    :min-height="350"
  >
    <template #header>
      <div class="flex items-center gap-2 ml-2">
        <!-- Edit mode switch -->
        <Switch
          id="snippet-edit-mode"
          :checked="isEditMode"
          :disabled="!selectedSnippetId"
          size="sm"
          @update:model-value="handleEditModeChange"
        />
        <Label
          for="snippet-edit-mode"
          class="text-muted-foreground cursor-pointer text-xs"
          :class="{ 'opacity-50': !selectedSnippetId }"
        >
          {{ t('snippet.edit_mode') }}
        </Label>
      </div>
    </template>

    <!-- Main content: sidebar + editor -->
    <div class="flex h-full">
      <!-- Left sidebar: snippet list -->
      <div class="w-44 flex-shrink-0 border-r border-border flex flex-col">
        <!-- New button -->
        <div class="p-2 border-b border-border">
          <Button size="sm" variant="outline" class="w-full" @click="handleCreateSnippet">
            <span class="i-mingcute-add-line mr-1" />
            {{ t('snippet.new') }}
          </Button>
        </div>

        <!-- Snippet list -->
        <div class="flex-1 overflow-auto">
          <div v-if="snippets.length === 0" class="p-4 text-center text-muted-foreground text-xs">
            {{ t('snippet.no_snippets') }}
          </div>
          <div
            v-for="snippet in snippets"
            :key="snippet.id"
            class="px-3 py-2 cursor-pointer border-b border-border/50 hover:bg-accent/50 transition-colors"
            :class="{ 'bg-accent': selectedSnippetId === snippet.id }"
            @click="handleSelectSnippet(snippet.id)"
          >
            <div class="text-sm truncate">
              {{ snippet.name }}
            </div>
            <div class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <span :class="snippet.mode === 'javascript' ? 'i-mingcute-code-line' : 'i-mingcute-route-line'" />
              <span>{{ formatTime(snippet.updatedTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: editor area -->
      <div class="flex-1 flex flex-col min-w-0">
        <template v-if="selectedSnippetId">
          <!-- Editor header: name + mode -->
          <div class="flex-shrink-0 p-3 border-b border-border space-y-2">
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground w-12">{{ t('snippet.name') }}</Label>
              <Input
                v-model="localName"
                :disabled="!isEditMode"
                :placeholder="t('snippet.untitled')"
                class="h-7 text-sm flex-1"
                @blur="handleNameBlur"
              />
            </div>
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground w-12">{{ t('snippet.mode') }}</Label>
              <ToggleGroup
                type="single"
                :model-value="localMode"
                :disabled="!isEditMode"
                @update:model-value="handleModeChange"
              >
                <ToggleGroupItem value="javascript" class="px-2 text-xs h-7">
                  JavaScript
                </ToggleGroupItem>
                <ToggleGroupItem value="jsonpath" class="px-2 text-xs h-7">
                  JSONPath
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <!-- Monaco editor -->
          <div class="flex-1 min-h-0">
            <MonacoEditor
              :value="localContent"
              :options="editorOptions"
              @update:value="handleContentChange"
            />
          </div>
        </template>

        <!-- Empty state when no snippet selected -->
        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <span class="i-mingcute-paper-line text-3xl mb-2 block opacity-50" />
          <p class="text-sm">
            {{ t('snippet.no_snippets_selected') }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        v-if="selectedSnippetId"
        size="sm"
        variant="destructive"
        @click="handleDeleteSnippet"
      >
        {{ t('snippet.delete') }}
      </Button>
      <Button
        size="sm"
        :disabled="!selectedSnippetId"
        @click="handleApply"
      >
        {{ t('snippet.apply') }}
      </Button>
    </template>
  </FloatingWindow>
</template>
