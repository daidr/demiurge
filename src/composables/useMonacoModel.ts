import type { editor } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import type { Ref } from 'vue'
import { onUnmounted, shallowRef, watch } from 'vue'

export interface MonacoModelOptions {
  /** Initial content for the model */
  content: Ref<string>
  /** Language ID (e.g., 'json', 'javascript') */
  language: string
  /** URI for the model (e.g., 'internal://demiurge/workspace.json') */
  uri: string
  /** Callback when editor content changes */
  onContentChange?: (content: string) => void
  /** Callback when editor is mounted */
  onMounted?: (editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) => void
  /** Callback when editor is unmounted */
  onUnmounted?: () => void
}

export interface MonacoModelReturn {
  /** Editor instance reference */
  editorRef: Ref<editor.IStandaloneCodeEditor | undefined>
  /** Monaco library reference */
  monacoRef: Ref<typeof Monaco | undefined>
  /** Handler for editor mount event */
  handleEditorMounted: (editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) => void
  /** Handler for editor unmount event */
  handleEditorUnmounted: () => void
  /** Get the current model instance */
  getModel: () => editor.ITextModel | null
}

/**
 * Composable for managing Monaco Editor model lifecycle
 *
 * Handles:
 * - Model creation and disposal
 * - Content synchronization (external -> editor)
 * - Change event handling (editor -> external)
 * - Cleanup on component unmount
 *
 * @example
 * ```ts
 * const { editorRef, monacoRef, handleEditorMounted, handleEditorUnmounted } = useMonacoModel({
 *   content: myContent,
 *   language: 'json',
 *   uri: 'internal://app/file.json',
 *   onContentChange: (newContent) => myContent.value = newContent,
 * })
 * ```
 */
export function useMonacoModel(options: MonacoModelOptions): MonacoModelReturn {
  const { content, language, uri, onContentChange, onMounted, onUnmounted: onUnmountedCallback } = options

  const editorRef = shallowRef<editor.IStandaloneCodeEditor>()
  const monacoRef = shallowRef<typeof Monaco>()
  let model: editor.ITextModel | null = null

  // Watch for external content changes and sync to editor
  watch(content, (newContent) => {
    if (model && model.getValue() !== newContent) {
      model.setValue(newContent || '')
    }
  })

  function handleEditorMounted(editor: editor.IStandaloneCodeEditor, monaco: typeof Monaco) {
    editorRef.value = editor
    monacoRef.value = monaco

    // Create model
    model = monaco.editor.createModel(
      content.value,
      language,
      monaco.Uri.parse(uri),
    )

    // Set model to editor
    editor.setModel(model)

    // Listen for content changes
    if (onContentChange) {
      editor.onDidChangeModelContent(() => {
        const value = editor.getValue()
        onContentChange(value)
      })
    }

    // Call user's onMounted callback
    if (onMounted) {
      onMounted(editor, monaco)
    }
  }

  function handleEditorUnmounted() {
    // Dispose model
    if (model) {
      model.dispose()
      model = null
    }

    // Dispose editor
    if (editorRef.value) {
      editorRef.value.dispose()
      editorRef.value = undefined
    }

    // Call user's onUnmounted callback
    if (onUnmountedCallback) {
      onUnmountedCallback()
    }
  }

  function getModel() {
    return model
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    handleEditorUnmounted()
  })

  return {
    editorRef,
    monacoRef,
    handleEditorMounted,
    handleEditorUnmounted,
    getModel,
  }
}
