import type { ManifestOptions } from 'vite-plugin-pwa'

export const VITE_PWA_MANIFEST: Partial<ManifestOptions> = {
  name: 'Demiurge',
  short_name: 'Demiurge',
  description: 'All-in-one JSON processing assistant',
  icons: [
    {
      src: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
  theme_color: '#ffffff',
  background_color: '#ffffff',
  start_url: 'https://json.daidr.me?utm_source=home_screen',
  display: 'standalone',
  display_override: [
    'window-controls-overlay',
    'standalone',
  ],
}
