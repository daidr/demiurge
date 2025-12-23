<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
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
import { configureJsonSchemaValidation } from '@/composables/useMonacoJsonSchema'
import { useMonacoModel } from '@/composables/useMonacoModel'
import { useSchemaStore } from '@/stores/schema'
import { useToolsStore } from '@/stores/tools'

const { t } = useI18n()
const schemaStore = useSchemaStore()
const toolsStore = useToolsStore()
const { schemas, isEditMode, editingSchema, editingSchemaId } = storeToRefs(schemaStore)
const { currentSchemaId, currentJsonSchema } = storeToRefs(toolsStore)

// Schema status: null = no schema, true = valid JSON schema, false = invalid JSON
const schemaStatus = computed(() => {
  if (!currentSchemaId.value || !currentJsonSchema.value) {
    return null
  }
  try {
    JSON.parse(currentJsonSchema.value)
    return true
  }
  catch {
    return false
  }
})

const isOpen = ref(false)

// New schema form
const newSchemaName = ref('')
const showNewSchemaPopover = ref(false)

// Editor content - tracks current editing schema content
const editorContent = computed(() => editingSchema.value?.content ?? '')

// Use Monaco model composable
const {
  editorRef,
  handleEditorMounted,
  handleEditorUnmounted,
} = useMonacoModel({
  content: editorContent,
  language: 'json',
  uri: 'internal://demiurge/json-schema.json',
  onContentChange: (value) => {
    // Only save changes in edit mode
    if (isEditMode.value && editingSchemaId.value) {
      schemaStore.updateSchemaContent(editingSchemaId.value, value)
    }
  },
  onMounted: (_editor, monaco) => {
    // Configure JSON Schema validation for the schema editor itself
    configureJsonSchemaValidation(monaco)
  },
})

// Editor options based on edit mode
const editorOptions = computed(() => ({
  formatOnType: true,
  formatOnPaste: true,
  readOnly: !isEditMode.value,
}))

// Update editor read-only state when edit mode changes
watch(isEditMode, (editMode) => {
  if (editorRef.value) {
    editorRef.value.updateOptions({ readOnly: !editMode })
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
    <Button size="xs" variant="ghost" class="relative" @click="openSchemaEditor">
      <span class="i-mingcute-file-check-line" />
      <!-- Status badge -->
      <span
        v-if="schemaStatus !== null"
        class="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-background"
        :class="schemaStatus ? 'bg-green-500 dark:bg-green-600' : 'bg-destructive'"
      />
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
          :model-value="isEditMode"
          :disabled="!currentSchemaId"
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
      @mounted="handleEditorMounted"
      @unmounted="handleEditorUnmounted"
    />
  </FloatingWindow>
</template>
