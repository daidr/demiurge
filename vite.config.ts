import { dirname, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import { gitDefine } from './config/git'
import { VITE_PWA_MANIFEST } from './config/manifest'

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
      VitePWA({
        registerType: 'prompt',
        manifest: VITE_PWA_MANIFEST,
        workbox: {
          runtimeCaching: [
            {
              // Cache Monaco Editor CDN resources
              urlPattern: /^https:\/\/cdn\.staticfile\.net\/monaco-editor\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'monaco-editor-cdn',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      ...gitDefineValues,
    },
    experimental: {
      enableNativePlugin: true,
    },
    build: {
      cssCodeSplit: false,
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: 'reka-ui',
                test: /node_modules[\\/]reka-ui/,
              },
              {
                name: 'locale',
                test: /unplugin-vue-i18n[\\/]messages/,
              },
              {
                name: 'vchart',
                test: /node_modules[\\/]@visactor[\\/]vchart/,
              },
              {
                name: 'vendor',
                test: (path: string) => {
                  return (
                    path.startsWith('\0vite')
                    || /node_modules[\\/]@vue/.test(path)
                  )
                },
              },
            ],
          },
        },
      },
    },
  }
})
