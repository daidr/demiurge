import fs from 'node:fs/promises'
import {
  defineConfig,
  presetIcons,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'

export default defineConfig({
  shortcuts: [
    {
      'animate-accordion-up': 'accordion-up',
      'animate-accordion-down': 'accordion-down',
    },
  ],
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        '(components|src)/**/*.{js,ts}',
      ],
    },
  },
  theme: {
    colors: {
    },
  },
  presets: [
    presetWind3(),
    presetAnimations(),
    presetShadcn(
      {
        color: 'slate',
        // With default setting for SolidUI, you need to set the darkSelector option.
        darkSelector: '[data-kb-theme="dark"]',
      },
      {
        componentLibrary: 'reka',
      },
    ),
    presetIcons({
      collections: {
        mingcute: () => import('@iconify-json/mingcute/icons.json').then(i => i.default),
        custom: {
          demiurge: () => fs.readFile('./design/logo-compressed.svg', 'utf-8'),
        },
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
