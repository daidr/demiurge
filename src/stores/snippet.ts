import type { PlaygroundMode, PlaygroundSnippet } from '@/db'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { uuidv7 } from 'uuidv7'
import { ref } from 'vue'
import { useCollectionAll, useCollectionItem } from '@/composables/useCollection'
import { snippetsCollection } from '@/db'

export const useSnippetStore = defineStore('snippet', () => {
  // All snippets (reactive, sorted by updatedTime descending)
  const snippets = useCollectionAll<PlaygroundSnippet, string>(snippetsCollection, {
    sort: { updatedTime: -1 },
  })

  // Currently selected snippet ID
  const selectedSnippetId = ref<string | null>(null)

  // Edit mode flag
  const isEditMode = ref(false)

  // Currently selected snippet (reactive)
  const selectedSnippet = useCollectionItem<PlaygroundSnippet, string>(
    snippetsCollection,
    () => selectedSnippetId.value,
  )

  // ========== Actions ==========

  function createSnippet(name: string, content: string = '', mode: PlaygroundMode = 'javascript'): string {
    const id = uuidv7()
    const now = Date.now()

    snippetsCollection.insert({
      id,
      name,
      content,
      mode,
      createdTime: now,
      updatedTime: now,
    })

    return id
  }

  function deleteSnippet(id: string): void {
    snippetsCollection.removeOne({ id })

    // If currently selected, clear selection
    if (selectedSnippetId.value === id) {
      selectedSnippetId.value = null
    }
  }

  function updateSnippet(id: string, updates: Partial<Pick<PlaygroundSnippet, 'name' | 'content' | 'mode'>>): void {
    snippetsCollection.updateOne(
      { id },
      { $set: { ...updates, updatedTime: Date.now() } },
    )
  }

  function setSelectedSnippet(id: string | null): void {
    selectedSnippetId.value = id
  }

  function setEditMode(enabled: boolean): void {
    isEditMode.value = enabled
  }

  return {
    // State
    snippets,
    selectedSnippetId,
    isEditMode,
    selectedSnippet,

    // Actions
    createSnippet,
    deleteSnippet,
    updateSnippet,
    setSelectedSnippet,
    setEditMode,
  }
})

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSnippetStore, import.meta.hot))
}
