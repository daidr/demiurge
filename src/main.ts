import messages from '@intlify/unplugin-vue-i18n/messages'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

import { getDefaultLanguage } from './composables/useInitI18n'
import '@unocss/reset/tailwind.css'
import './assets/main.css'
import 'virtual:uno.css'

if (import.meta.env.DEV) {
  import('@signaldb/devtools')
}

window.MonacoEnvironment = {
  getWorkerUrl(_, label) {
    if (label === 'json') {
      return new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url).toString()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url).toString()
    }
    return new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url).toString()
  },
}

const i18n = createI18n({
  locale: 'en',
  messages,
})

async function initApp() {
  // 前置的 monaco 多语言判断
  if (localStorage.getItem('demiurge-locale') === 'zh-CN') {
    // @ts-expect-error 忽略 monaco 多语言类型错误
    await import('monaco-editor/esm/nls.messages.zh-cn.js')
  }
  else {
    const defaultLanguage = getDefaultLanguage(Object.keys(messages as any))
    if (defaultLanguage === 'zh-CN') {
      // @ts-expect-error 忽略 monaco 多语言类型错误
      await import('monaco-editor/esm/nls.messages.zh-cn.js')
    }
  }

  const App = (await import('./App.vue')).default
  const app = createApp(App)

  app.use(i18n)
  app.use(createPinia())

  app.mount('#app')
}

initApp()
