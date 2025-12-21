import type { Schema } from '@/db'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { uuidv7 } from 'uuidv7'
import { computed, ref } from 'vue'
import { useCollectionAll, useCollectionItem } from '@/composables/useCollection'
import { schemasCollection, tabsCollection } from '@/db'

export const useSchemaStore = defineStore('schema', () => {
  // All schemas (reactive)
  const schemas = useCollectionAll<Schema, string>(schemasCollection, {
    sort: { name: 1 },
  })

  // Currently editing schema ID
  const editingSchemaId = ref<string | null>(null)

  // Edit mode flag
  const isEditMode = ref(false)

  // Currently editing schema (reactive)
  const editingSchema = useCollectionItem<Schema, string>(
    schemasCollection,
    () => editingSchemaId.value,
  )

  // Schema content for editing
  const editingContent = computed(() => editingSchema.value?.content ?? '')

  // ========== Actions ==========

  function createSchema(name: string): string {
    const id = uuidv7()
    const now = Date.now()

    schemasCollection.insert({
      id,
      name,
      content: '{}',
      createdTime: now,
      updatedTime: now,
    })

    return id
  }

  function deleteSchema(id: string): void {
    // Clear schemaId for all tabs using this schema
    const tabs = tabsCollection.find({ schemaId: id }, { reactive: false }).fetch()
    for (const tab of tabs) {
      tabsCollection.updateOne({ id: tab.id }, { $set: { schemaId: null } })
    }

    // Delete the schema
    schemasCollection.removeOne({ id })

    // If currently editing this schema, clear editing state
    if (editingSchemaId.value === id) {
      editingSchemaId.value = null
      isEditMode.value = false
    }
  }

  function updateSchemaContent(id: string, content: string): void {
    schemasCollection.updateOne(
      { id },
      { $set: { content, updatedTime: Date.now() } },
    )
  }

  function updateSchemaName(id: string, name: string): void {
    schemasCollection.updateOne(
      { id },
      { $set: { name, updatedTime: Date.now() } },
    )
  }

  function setEditingSchema(id: string | null): void {
    editingSchemaId.value = id
  }

  function setEditMode(enabled: boolean): void {
    isEditMode.value = enabled
  }

  function getSchemaById(id: string): Schema | undefined {
    return schemasCollection.findOne({ id })
  }

  return {
    // State
    schemas,
    editingSchemaId,
    isEditMode,
    editingSchema,
    editingContent,

    // Actions
    createSchema,
    deleteSchema,
    updateSchemaContent,
    updateSchemaName,
    setEditingSchema,
    setEditMode,
    getSchemaById,
  }
})

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchemaStore, import.meta.hot))
}
