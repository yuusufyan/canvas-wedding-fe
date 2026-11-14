import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMe, login as apiLogin, logout as apiLogout } from '@/api/auth'
import { refreshAccessToken } from '@/api/http'
import { clearSession, getRefreshToken } from '@/api/token'
import type { MeResponse, RoleSummary } from '@/types/auth'

export interface SessionProfile {
  id: string
  name: string
  email: string
  role: RoleSummary
  is_active: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const profile = ref<SessionProfile | null>(null)
  const sessionExpiredNotice = ref(false)

  const isSuperAdmin = computed(() => profile.value?.role.name === 'SuperAdmin')

  // Shared across concurrent bootstrap()/guard calls so the refresh+me
  // sequence only ever runs once per app load.
  let bootstrapPromise: Promise<void> | null = null

  function applyProfile(me: MeResponse): void {
    profile.value = {
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      is_active: me.is_active,
    }
    isAuthenticated.value = true
  }

  function clearProfile(): void {
    profile.value = null
    isAuthenticated.value = false
  }

  async function login(email: string, password: string): Promise<void> {
    await apiLogin(email, password)
    const me = await getMe()
    applyProfile(me)
  }

  async function logout(): Promise<void> {
    await apiLogout()
    clearProfile()
  }

  async function runBootstrap(): Promise<void> {
    if (!getRefreshToken()) {
      clearProfile()
      return
    }

    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      clearProfile()
      return
    }

    try {
      const me = await getMe({ skipRetry: true })
      applyProfile(me)
    } catch {
      clearSession()
      clearProfile()
    }
  }

  function bootstrap(): Promise<void> {
    if (!bootstrapPromise) {
      bootstrapPromise = runBootstrap()
    }
    return bootstrapPromise
  }

  function notifySessionExpired(): void {
    sessionExpiredNotice.value = true
    clearProfile()
  }

  function consumeSessionExpiredNotice(): boolean {
    const notice = sessionExpiredNotice.value
    sessionExpiredNotice.value = false
    return notice
  }

  return {
    isAuthenticated,
    profile,
    isSuperAdmin,
    login,
    logout,
    bootstrap,
    notifySessionExpired,
    consumeSessionExpiredNotice,
  }
})
