import type { NavigationGuardWithThis } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Routes reachable without a session: landing, demo, login, and the 404 catch-all. */
    public?: boolean
    /** Requires SuperAdmin role to access. */
    requireSuperAdmin?: boolean
  }
}

// Default-deny: every route needs a verified session unless marked public.
// Waits for bootstrap() so a reload never renders protected content
// before the stored refresh token has been checked.
export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore()
  await authStore.bootstrap()

  // Pengguna yang sudah masuk tidak perlu melihat Masuk/Daftar: SuperAdmin ke halaman admin
  // yang ada, role lain ke area pelanggan.
  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    return authStore.isSuperAdmin ? { name: 'home' } : '/app'
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requireSuperAdmin && !authStore.isSuperAdmin) {
    return { name: 'forbidden' }
  }

  return true
}
