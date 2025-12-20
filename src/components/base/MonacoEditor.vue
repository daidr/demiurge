<script setup lang="ts">
import { useElementBounding } from '@vueuse/core'
import { editor } from 'monaco-editor'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

const props = defineProps<{
  options?: editor.IStandaloneEditorConstructionOptions
}>()

const emit = defineEmits<{
  mounted: [editor.IStandaloneCodeEditor]
  unmounted: [editor.IStandaloneCodeEditor]
}>()

const EditorRef = shallowRef<editor.IStandaloneCodeEditor>()
const ContainerRef = ref<HTMLDivElement | null>(null)
const OverflowRef = ref<HTMLDivElement | null>(null)
const { x, y } = useElementBounding(ContainerRef)

onMounted(() => {
  if (ContainerRef.value) {
    const MONACO_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
      ...props.options || {},
      automaticLayout: true,
      overflowWidgetsDomNode: OverflowRef.value!,
    }
    const _editor = editor.create(ContainerRef.value, MONACO_EDITOR_OPTIONS)
    EditorRef.value = _editor
    emit('mounted', _editor)
  }
})

onUnmounted(() => {
  if (EditorRef.value) {
    emit('unmounted', EditorRef.value)
    EditorRef.value.dispose()
  }
})

watch(() => props.options, (newOptions) => {
  if (EditorRef.value && newOptions) {
    EditorRef.value.updateOptions(newOptions)

    if (!newOptions.language) {
      return
    }
    const model = EditorRef.value.getModel()
    if (!model) {
      return
    }
    editor.setModelLanguage(model, newOptions.language)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="OverflowRef" class="monaco-editor-overflows monaco-editor" :style="{
        transform: `translate(${x}px, ${y}px)`,
      }"
    />
  </Teleport>
  <div ref="ContainerRef" class="h-full w-full" />
</template>

<style scoped>
.monaco-editor-overflows {
  @apply important-fixed top-0 left-0 z-99;
}
</style>
