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

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requireSuperAdmin && !authStore.isSuperAdmin) {
    return { name: 'home' }
  }

  return true
}
