import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  getRoleMenus,
  getRolePermissions,
  listCatalogMenus,
  listPermissions,
  setRoleMenus,
  setRolePermissions,
} from '../access'
import {
  getInvitationStats,
  getRecentActivity,
  getRegistrationTrend,
  getTopTemplates,
} from '../dashboard'
import { installMockApi } from '../mock'
import { clearSession, setSession } from '../token'
import { API_BASE_URL } from '@/constants/api'

function envelope(data: unknown): Response {
  return new Response(
    JSON.stringify({ code: 200, status: 'OK', message: '', data, meta: undefined }),
    {
      status: 200,
    },
  )
}

describe('API izin, menu, dan dashboard', () => {
  let fetchMock: Mock<typeof fetch>

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => envelope([]))
    vi.stubGlobal('fetch', fetchMock)
    setSession({ accessToken: 'tok', refreshToken: 'ref', tokenType: 'Bearer', expiresIn: 60 }) // secret-scan:ignore nilai palsu
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
  })

  function lastCall(): [string, RequestInit] {
    const calls = fetchMock.mock.calls
    return calls[calls.length - 1] as [string, RequestInit]
  }

  it('TC-UI-F5-07: katalog permission dan menu diminta dengan limit 100', async () => {
    await listPermissions()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/permissions?page=1&limit=100`)
    await listCatalogMenus()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/menus?page=1&limit=100`)
  })

  it('TC-UI-F5-08: GET dan PUT izin/menu per role mengirim set lengkap dan meng-encode ID', async () => {
    await getRolePermissions('a/b')
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/roles/a%2Fb/permissions`)

    await setRolePermissions('r1', ['templates.read', 'guests.read'])
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/roles/r1/permissions`)
    expect(lastCall()[1].method).toBe('PUT')
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      permissions: ['templates.read', 'guests.read'],
    })

    await getRoleMenus('r1')
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/roles/r1/menus`)
    await setRoleMenus('r1', ['admin.dashboard'])
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ menus: ['admin.dashboard'] })
  })

  it('TC-UI-F5-09: endpoint dashboard (draf) dipanggil lewat GET dengan token', async () => {
    await getInvitationStats()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/dashboard/invitations`)
    await getRegistrationTrend()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/dashboard/registrations`)
    await getTopTemplates()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/dashboard/top-templates`)
    await getRecentActivity()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/dashboard/activity`)
    expect((lastCall()[1].headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })
})

const AUTH = { Authorization: 'Bearer mock-access-token' }

describe('mock dashboard & penerusan endpoint RBAC ke BE nyata', () => {
  let realFetch: Mock<typeof fetch>

  beforeEach(() => {
    vi.useFakeTimers()
    realFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))
    window.fetch = realFetch as unknown as typeof window.fetch
    installMockApi()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete window.__nkMock
  })

  async function call(path: string, method = 'GET', body?: unknown) {
    const pending = window.fetch(path, {
      method,
      headers: AUTH,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    await vi.advanceTimersByTimeAsync(5000)
    return pending
  }
  const json = async (res: Response) => (await res.json()).data

  it('TC-UI-F5-16: dashboard mock butuh token, mode empty mengosongkan data', async () => {
    const unauthenticated = window.fetch(`${API_BASE_URL}/dashboard/activity`)
    await vi.advanceTimersByTimeAsync(5000)
    expect((await unauthenticated).status).toBe(401)
    expect((await json(await call(`${API_BASE_URL}/dashboard/registrations`))).length).toBe(5)
    expect((await json(await call(`${API_BASE_URL}/dashboard/top-templates`)))[0].name).toBe(
      'Rustic Hijau',
    )
    expect(
      (await json(await call(`${API_BASE_URL}/dashboard/invitations`))).invitations_active,
    ).toBe(128)

    window.__nkMock = 'empty'
    expect(await json(await call(`${API_BASE_URL}/dashboard/activity`))).toEqual([])
  })

  it('endpoint RBAC dan auth utama diteruskan langsung ke backend tanpa dicegat mock', async () => {
    for (const path of ['/auth/me', '/users', '/roles', '/permissions', '/menus']) {
      await call(`${API_BASE_URL}${path}`)
    }
    expect(realFetch).toHaveBeenCalledTimes(5)
  })
})
