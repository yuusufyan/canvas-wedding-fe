import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'
import { setSessionExpiredCallback } from '@/api/http'
import { clearSession, getAccessToken, getRefreshToken, setSession } from '@/api/token'
import type { MeResponse, TokenResponse } from '@/types/auth'

const tokens: TokenResponse = {
  access_token: 'access-1', // secret-scan:ignore fake value
  refresh_token: 'refresh-1', // secret-scan:ignore fake value
  token_type: 'Bearer',
  expires_in: 1800,
}

const profile: MeResponse = {
  id: 'f2a6c1f0-0000-4000-8000-000000000001',
  name: 'Super Admin',
  email: 'superadmin@example.com',
  role: { id: 'role-superadmin', name: 'SuperAdmin' },
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }

function jsonResponse(status: number, data: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ code: status, status: 'ok', message: '', data }),
  }
}

type FetchMock = (url: string, init?: RequestInit) => Promise<MockResponse>

beforeEach(() => {
  setActivePinia(createPinia())
  clearSession()
  setSessionExpiredCallback(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAuthStore().bootstrap()', () => {
  it('TC-UNIT-23: restores the session before any non-public page is considered ready', async () => {
    setSession({ ...tokens, access_token: 'stale' })
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') return jsonResponse(200, tokens)
      if (url === '/api/v1/auth/me') return jsonResponse(200, profile)
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.bootstrap()

    expect(store.isAuthenticated).toBe(true)
    expect(store.isSuperAdmin).toBe(true)
    expect(store.profile).toEqual({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
    })
  })

  it('TC-UNIT-24: a failed refresh means GET /auth/me is never called and the session stays invalid', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') return jsonResponse(401, null)
      throw new Error('GET /auth/me must not be called')
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.bootstrap()

    expect(store.isAuthenticated).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('TC-UNIT-25: a successful refresh followed by a failing GET /auth/me invalidates and clears the session', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') return jsonResponse(200, tokens)
      if (url === '/api/v1/auth/me') return jsonResponse(500, null)
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.bootstrap()

    expect(store.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('bootstrap() is idempotent: concurrent callers share one refresh+me sequence', async () => {
    setSession(tokens)
    let refreshCalls = 0
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse(200, tokens)
      }
      if (url === '/api/v1/auth/me') return jsonResponse(200, profile)
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await Promise.all([store.bootstrap(), store.bootstrap()])

    expect(refreshCalls).toBe(1)
    expect(store.isAuthenticated).toBe(true)
  })
})

describe('data exposure', () => {
  it('TC-UNIT-26: after login, sessionStorage holds only the refresh token and localStorage is untouched', async () => {
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/login') return jsonResponse(200, tokens)
      if (url === '/api/v1/auth/me') return jsonResponse(200, profile)
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.login('superadmin@example.com', 'rahasia123')

    expect(sessionStorage.length).toBe(1)
    const key = sessionStorage.key(0)
    expect(key).not.toBeNull()
    expect(sessionStorage.getItem(key as string)).toBe(tokens.refresh_token)
    expect(typeof localStorage === 'undefined' ? 0 : localStorage.length).toBe(0)
  })
})

describe('useAuthStore() menus dan permissions', () => {
  async function bootstrapWith(me: MeResponse) {
    setSession(tokens)
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async (url) =>
        url === '/api/v1/auth/refresh' ? jsonResponse(200, tokens) : jsonResponse(200, me),
      ),
    )
    const store = useAuthStore()
    await store.bootstrap()
    return store
  }

  it('TC-UI-F3-73: menyimpan menus dan permissions dari /auth/me dan mengosongkannya saat logout', async () => {
    const menus = [
      {
        key: 'admin.templates',
        label: 'Template',
        path: '/admin/template',
        icon: 'layout',
        parent_key: null,
        sort_order: 20,
      },
    ]
    const store = await bootstrapWith({ ...profile, menus, permissions: ['templates.read'] })

    expect(store.menus).toEqual(menus)
    expect(store.permissions).toEqual(['templates.read'])

    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => jsonResponse(204, null)),
    )
    await store.logout()
    expect(store.menus).toEqual([])
    expect(store.permissions).toEqual([])
  })

  it('TC-UI-F3-74: backend lama tanpa menus/permissions menghasilkan daftar kosong', async () => {
    const store = await bootstrapWith(profile)

    expect(store.menus).toEqual([])
    expect(store.permissions).toEqual([])
  })
})
