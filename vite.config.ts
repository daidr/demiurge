import { dirname, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import { gitDefine } from './config/git'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const gitDefineValues = await gitDefine()

  return {
    plugins: [
      vue(),
      vueDevTools(),
      UnoCSS(),
      VueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './locales/[^_]*.json'),
      }),
      VitePWA({ registerType: 'autoUpdate' }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      ...gitDefineValues,
    },
  }
})
