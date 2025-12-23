import { loader } from '@guolao/vue-monaco-editor'
import messages from '@intlify/unplugin-vue-i18n/messages'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import { getDefaultLanguage } from './composables/useInitI18n'
import { init as initInstallEvent } from './utils/pwa'
import '@unocss/reset/tailwind.css'
import './assets/main.css'
import 'virtual:uno.css'

initInstallEvent()

if (import.meta.env.DEV) {
  import('@signaldb/devtools')
}

// 配置 Monaco Editor 使用 CDN 加载
const MONACO_VERSION = '0.55.0'
// const CDN_BASE = `https://registry.npmmirror.com/monaco-editor/${MONACO_VERSION}/files`
// const CDN_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}`
const CDN_BASE = `https://unpkg.com/monaco-editor@${MONACO_VERSION}`

// 根据语言偏好设置 Monaco 的 locale
function getMonacoLocale(): string | undefined {
  const storedLocale = localStorage.getItem('demiurge-locale')
  if (storedLocale === 'zh-CN') {
    return 'zh-cn'
  }
  const defaultLanguage = getDefaultLanguage(Object.keys(messages as any))
  if (defaultLanguage === 'zh-CN') {
    return 'zh-cn'
  }
  return undefined
}

const monacoLocale = getMonacoLocale()

loader.config({
  paths: {
    vs: `${CDN_BASE}/min/vs`,
  },
})

// 手动加载 nls，不依赖 loader
if (monacoLocale) {
  const path = `${CDN_BASE}/esm/nls.messages.${monacoLocale}.js`
  const script = document.createElement('script')
  script.src = path
  document.head.appendChild(script)
}

const i18n = createI18n({
  locale: 'en',
  messages,
})

const app = createApp(App)

app.use(i18n)
app.use(createPinia())

app.mount('#app')
