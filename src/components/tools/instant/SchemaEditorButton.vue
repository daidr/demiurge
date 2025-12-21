<script setup lang="ts">
import type { editor as monacoEditor } from 'monaco-editor'
import { editor, json, Uri } from 'monaco-editor'
import { storeToRefs } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoEditor from '@/components/base/MonacoEditor.vue'
import BaseTooltip from '@/components/BaseTooltip.vue'
import { Button } from '@/components/ui/button'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSchemaStore } from '@/stores/schema'
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

const { t } = useI18n()
const schemaStore = useSchemaStore()
const toolsStore = useToolsStore()
const { schemas, isEditMode, editingSchema, editingSchemaId } = storeToRefs(schemaStore)
const { currentSchemaId, currentJsonSchema } = storeToRefs(toolsStore)

const isOpen = ref(false)
const EditorRef = shallowRef<monacoEditor.IStandaloneCodeEditor>()
let model: monacoEditor.ITextModel | null = null

// New schema form
const newSchemaName = ref('')
const showNewSchemaPopover = ref(false)

// Editor content - tracks current editing schema content
const editorContent = computed(() => editingSchema.value?.content ?? '')

// Open the floating window when a schema is selected and has content or edit mode is on
watch([currentSchemaId, isEditMode], ([schemaId, editMode]) => {
  if (schemaId && (editMode || currentJsonSchema.value)) {
    isOpen.value = true
    // Set the editing schema when opening
    schemaStore.setEditingSchema(schemaId)
  }
})

// Sync editing schema content to editor
watch(editorContent, (newContent) => {
  if (model && model.getValue() !== newContent) {
    model.setValue(newContent)
  }
})

// Editor options based on edit mode
const editorOptions = computed(() => ({
  formatOnType: true,
  formatOnPaste: true,
  readOnly: !isEditMode.value,
}))

function onEditorMounted(_editor: monacoEditor.IStandaloneCodeEditor) {
  EditorRef.value = _editor
  model = editor.createModel(
    editorContent.value,
    'json',
    Uri.parse('internal://demiurge/json-schema.json'),
  )
  _editor.setModel(model)

  // Only save changes in edit mode
  _editor.onDidChangeModelContent(() => {
    if (isEditMode.value && editingSchemaId.value) {
      schemaStore.updateSchemaContent(editingSchemaId.value, _editor.getValue())
    }
  })
}

function onEditorUnmounted() {
  if (model) {
    model.dispose()
    model = null
  }
}

// Update editor read-only state when edit mode changes
watch(isEditMode, (editMode) => {
  if (EditorRef.value) {
    EditorRef.value.updateOptions({ readOnly: !editMode })
  }
})

// Schema selector handlers
function handleSchemaChange(value: unknown) {
  if (value === '__none__') {
    toolsStore.setTabSchemaId(null)
    schemaStore.setEditingSchema(null)
  }
  else if (typeof value === 'string') {
    toolsStore.setTabSchemaId(value)
    schemaStore.setEditingSchema(value)
  }
}

function handleEditModeChange(checked: boolean) {
  schemaStore.setEditMode(checked)
  if (checked && currentSchemaId.value) {
    schemaStore.setEditingSchema(currentSchemaId.value)
  }
}

function handleCreateSchema() {
  if (!newSchemaName.value.trim())
    return

  const id = schemaStore.createSchema(newSchemaName.value.trim())
  toolsStore.setTabSchemaId(id)
  schemaStore.setEditingSchema(id)
  schemaStore.setEditMode(true)

  newSchemaName.value = ''
  showNewSchemaPopover.value = false
}

function openSchemaEditor() {
  isOpen.value = true
  if (currentSchemaId.value) {
    schemaStore.setEditingSchema(currentSchemaId.value)
  }
}
</script>

<template>
  <!-- Schema Editor Button -->
  <BaseTooltip :text="t('schema.open_editor')">
    <Button size="xs" variant="ghost" @click="openSchemaEditor">
      <span class="i-mingcute-braces-line" />
    </Button>
  </BaseTooltip>

  <FloatingWindow
    v-model="isOpen"
    :title="t('schema.editor_title')"
    :initial-width="600"
    :initial-height="500"
    :min-width="500"
    :min-height="300"
  >
    <template #header>
      <div class="flex items-center gap-2 ml-2">
        <!-- Schema selector -->
        <Select
          :model-value="currentSchemaId ?? '__none__'"
          @update:model-value="handleSchemaChange"
        >
          <SelectTrigger class="h-6 w-36 text-xs">
            <SelectValue :placeholder="t('schema.select_schema')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              {{ t('schema.no_schema') }}
            </SelectItem>
            <SelectItem
              v-for="schema in schemas"
              :key="schema.id"
              :value="schema.id"
            >
              {{ schema.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- New schema button -->
        <Popover v-model:open="showNewSchemaPopover">
          <PopoverTrigger as-child>
            <Button size="xs" variant="outline" class="h-6">
              <div class="i-mingcute-add-line" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-60">
            <div class="flex flex-col gap-3">
              <div class="text-sm font-medium">
                {{ t('schema.create_schema') }}
              </div>
              <div class="flex flex-col gap-2">
                <Label for="schema-name" class="text-xs">{{ t('schema.name') }}</Label>
                <Input
                  id="schema-name"
                  v-model="newSchemaName"
                  :placeholder="t('schema.name_placeholder')"
                  class="h-8"
                  @keydown.enter="handleCreateSchema"
                />
              </div>
              <Button size="sm" :disabled="!newSchemaName.trim()" @click="handleCreateSchema">
                {{ t('common.create') }}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </template>

    <template #toolbar>
      <!-- Edit mode switch -->
      <div class="flex items-center gap-1.5">
        <Switch
          id="edit-mode-switch"
          :checked="isEditMode"
          :disabled="!currentSchemaId"
          size="sm"
          @update:model-value="handleEditModeChange"
        />
        <Label
          for="edit-mode-switch"
          class="text-muted-foreground cursor-pointer text-xs"
          :class="{ 'opacity-50': !currentSchemaId }"
        >
          {{ t('schema.edit_mode') }}
        </Label>
      </div>
    </template>

    <MonacoEditor
      :options="editorOptions"
      @mounted="onEditorMounted"
      @unmounted="onEditorUnmounted"
    />
  </FloatingWindow>
</template>
