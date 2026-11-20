import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setSessionExpiredCallback } from './api/http'
import { loadMockApi } from './config'
import './styles/niskala.css'
import { useAuthStore } from './stores/auth'

// Data contoh untuk endpoint yang belum ada di backend; hanya dev dan tidak masuk bundle produksi.
if (loadMockApi) {
  const { installMockApi } = await loadMockApi()
  installMockApi()
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

// The only place that connects the auth/http module (which never imports a
// store) to the session store's notice flag — see change-plan "wiring sesi awal".
setSessionExpiredCallback(() => useAuthStore().notifySessionExpired())

// Delay mounting until the first navigation (including authGuard's
// bootstrap()) resolves, so the static "Memuat sesi…" screen in index.html
// is what's visible until the session state is known.
router.isReady().then(() => {
  app.mount('#app')
})
