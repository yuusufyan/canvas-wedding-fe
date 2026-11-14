import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const DEFAULT_API_PROXY_TARGET = 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: API_PROXY_TARGET is read only by the dev server and never reaches the bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // The backend does not enable CORS, so the dev server forwards API calls to it.
      proxy: {
        '/api': apiProxyTarget,
      },
    },
  }
})
