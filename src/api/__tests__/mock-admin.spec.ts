import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockApi } from '../mock'
import { API_BASE_URL } from '@/constants/api'

const AUTH = { Authorization: 'Bearer mock-access-token' }

describe('mock API admin dan auth', () => {
  let realFetch: ReturnType<typeof vi.fn<typeof fetch>>

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

  async function call(path: string, init?: RequestInit) {
    const pending = window.fetch(path, init)
    await vi.advanceTimersByTimeAsync(5000)
    return pending
  }

  const post = (path: string, body: unknown, headers: Record<string, string> = AUTH) =>
    call(path, { method: 'POST', body: JSON.stringify(body), headers })

  const get = (path: string) => call(path, { headers: AUTH })

  it('TC-UI-F3-11: login, refresh, me, dan logout diteruskan ke backend nyata (tidak di-mock)', async () => {
    await post(`${API_BASE_URL}/auth/login`, { email: 'admin@contoh.test', password: 'abc' })
    await post(`${API_BASE_URL}/auth/refresh`, { refreshToken: 'tok' })
    await get(`${API_BASE_URL}/auth/me`)
    await post(`${API_BASE_URL}/auth/logout`, { refreshToken: 'tok' })
    expect(realFetch).toHaveBeenCalledTimes(4)
  })

  it('TC-UI-F3-12: endpoint admin butuh token; mode forbidden, error, dan empty berlaku', async () => {
    expect((await call(`${API_BASE_URL}/templates`)).status).toBe(401)

    window.__nkMock = 'forbidden'
    expect((await get(`${API_BASE_URL}/templates`)).status).toBe(403)
    window.__nkMock = 'error'
    expect((await get(`${API_BASE_URL}/memberships`)).status).toBe(500)
    window.__nkMock = 'empty'
    expect((await (await get(`${API_BASE_URL}/templates`)).json()).data).toEqual([])
    expect((await (await get(`${API_BASE_URL}/templates/counts`)).json()).data.all).toBe(0)
    expect((await (await get(`${API_BASE_URL}/memberships/summary`)).json()).data.total).toBe(0)
  })

  it('TC-UI-F3-13: daftar template menyaring, mengurutkan, dan membuat template baru', async () => {
    const draft = await (await get(`${API_BASE_URL}/templates?status=Draft`)).json()
    expect(draft.data.map((t: { name: string }) => t.name)).toEqual([
      'Floral Blush',
      'Batik Klasik',
    ])

    const sorted = await (
      await get(`${API_BASE_URL}/templates?sort=name_asc&access=Premium`)
    ).json()
    expect(sorted.data[0].name).toBe('Batik Klasik')
    expect((await (await get(`${API_BASE_URL}/templates?q=sage`)).json()).meta.total).toBe(1)

    expect((await post(`${API_BASE_URL}/templates`, { name: '' })).status).toBe(400)
    const dup = await post(`${API_BASE_URL}/templates`, { name: 'rustic hijau', access: 'Gratis' })
    expect(dup.status).toBe(409)
    const created = await post(`${API_BASE_URL}/templates`, {
      name: 'Rustic Emas',
      access: 'Premium',
    })
    expect((await created.json()).data.status).toBe('Draft')
    expect((await (await get(`${API_BASE_URL}/templates/counts`)).json()).data.all).toBe(9)
  })

  it('TC-UI-F3-14: ubah akses, terbitkan, arsipkan, hapus; template yang dipakai tidak bisa dihapus', async () => {
    const patch = (id: string, body: unknown) =>
      call(`${API_BASE_URL}/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: AUTH,
      })
    const changed = await patch('tpl-garden-sage', { access: 'Premium' })
    expect((await changed.json()).data.access).toBe('Premium')
    expect((await patch('tidak-ada', { access: 'Gratis' })).status).toBe(404)

    const published = await post(`${API_BASE_URL}/templates/tpl-batik-klasik/publish`, {})
    expect((await published.json()).data.status).toBe('Terbit')
    const archived = await post(`${API_BASE_URL}/templates/tpl-batik-klasik/archive`, {})
    expect((await archived.json()).data.status).toBe('Arsip')

    const del = (id: string) =>
      call(`${API_BASE_URL}/templates/${id}`, { method: 'DELETE', headers: AUTH })
    expect((await del('tpl-rustic-hijau')).status).toBe(409)
    expect((await del('tpl-floral-blush')).status).toBe(204)
    expect((await del('tpl-floral-blush')).status).toBe(404)
  })

  it('TC-UI-F3-15: membership berpaginasi, difilter status dan nama, email sudah tersamar', async () => {
    const page2 = await (await get(`${API_BASE_URL}/memberships?page=2&limit=10`)).json()
    expect(page2.meta).toMatchObject({ page: 2, limit: 10, total: 34 })
    expect(page2.data).toHaveLength(10)
    expect(page2.data[0].email).toMatch(/^[a-z]\*\*\*@contoh\.test$/)

    const expired = await (await get(`${API_BASE_URL}/memberships?status=Kedaluwarsa`)).json()
    expect(expired.data.every((m: { status: string }) => m.status === 'Kedaluwarsa')).toBe(true)
    expect(
      (await (await get(`${API_BASE_URL}/memberships?q=nadia`)).json()).data.length,
    ).toBeGreaterThan(0)

    const summary = (await (await get(`${API_BASE_URL}/memberships/summary`)).json()).data
    expect(summary.total).toBe(34)
    expect(summary.active + summary.trial + summary.expiring_soon + summary.expired).toBe(34)
  })
})
