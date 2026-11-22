import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineConfig({
    plugins: [
      {
        // Asset absolut di template (/vuexy/..., /brand/...) diimpor sebagai modul oleh
        // compiler SFC; di test cukup dijawab string kosong agar suite tidak gagal dimuat.
        name: 'stub-public-assets',
        enforce: 'pre',
        resolveId(id) {
          return /^\/(vuexy|brand|fonts)\//.test(id) ? `\0public:${id}` : null
        },
        load(id) {
          return id.startsWith('\0public:') ? 'export default ""' : null
        },
      },
    ],
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/main.ts'],
      },
    },
  }),
)
