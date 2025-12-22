import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

export function useEditorTheme() {
  const mode = useColorMode()
  const editorTheme = computed(() => mode.value === 'dark' ? 'vs-dark' : 'vs')
  return { editorTheme, isDark: computed(() => mode.value === 'dark') }
}
