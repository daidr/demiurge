import messages from '@intlify/unplugin-vue-i18n/messages'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'

import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { createPinia } from 'pinia'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import './assets/main.css'
import 'virtual:uno.css'

if (import.meta.env.DEV) {
  import('@signaldb/devtools')
}

window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new JsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker()
    }
    return new EditorWorker()
  },
}

const i18n = createI18n({
  locale: 'en',
  messages,
})

const app = createApp(App)

app.use(i18n)
app.use(createPinia())

app.mount('#app')
