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
    setSession({ access_token: 'tok', refresh_token: 'ref', token_type: 'Bearer', expires_in: 60 }) // secret-scan:ignore nilai palsu
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
    expect(lastCall()[0]).toBe('/api/v1/permissions?page=1&limit=100')
    await listCatalogMenus()
    expect(lastCall()[0]).toBe('/api/v1/menus?page=1&limit=100')
  })

  it('TC-UI-F5-08: GET dan PUT izin/menu per role mengirim set lengkap dan meng-encode ID', async () => {
    await getRolePermissions('a/b')
    expect(lastCall()[0]).toBe('/api/v1/roles/a%2Fb/permissions')

    await setRolePermissions('r1', ['templates.read', 'guests.read'])
    expect(lastCall()[0]).toBe('/api/v1/roles/r1/permissions')
    expect(lastCall()[1].method).toBe('PUT')
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({
      permissions: ['templates.read', 'guests.read'],
    })

    await getRoleMenus('r1')
    expect(lastCall()[0]).toBe('/api/v1/roles/r1/menus')
    await setRoleMenus('r1', ['admin.dashboard'])
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ menus: ['admin.dashboard'] })
  })

  it('TC-UI-F5-09: endpoint dashboard (draf) dipanggil lewat GET dengan token', async () => {
    await getInvitationStats()
    expect(lastCall()[0]).toBe('/api/v1/dashboard/invitations')
    await getRegistrationTrend()
    expect(lastCall()[0]).toBe('/api/v1/dashboard/registrations')
    await getTopTemplates()
    expect(lastCall()[0]).toBe('/api/v1/dashboard/top-templates')
    await getRecentActivity()
    expect(lastCall()[0]).toBe('/api/v1/dashboard/activity')
    expect((lastCall()[1].headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })
})

const AUTH = { Authorization: 'Bearer mock-access-token' }

describe('mock pengguna, role, izin, dan menu', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}')) as unknown as typeof window.fetch
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
  const ME = '00000000-0000-4000-8000-000000000001'
  const SUPERADMIN = '00000000-0000-4000-8000-0000000000a1'
  const USER = '00000000-0000-4000-8000-0000000000a2'
  const OPERATOR = '00000000-0000-4000-8000-0000000000a3'

  it('TC-UI-F5-10: daftar pengguna berpaginasi dengan email penuh, tanpa field sensitif', async () => {
    const res = await call('/api/v1/users?page=2&limit=5')
    const body = await res.json()

    expect(body.meta).toMatchObject({ page: 2, limit: 5, total: 12 })
    expect(body.data).toHaveLength(5)
    expect(JSON.stringify(body.data)).not.toContain('password')
    expect((await json(await call(`/api/v1/users/${ME}`))).email).toBe('admin@contoh.test')
    expect((await call('/api/v1/users/bukan-uuid')).status).toBe(400)
    expect((await call('/api/v1/users/00000000-0000-4000-8000-0000000000ff')).status).toBe(404)
  })

  it('TC-UI-F5-11: buat pengguna memvalidasi, menolak email kembar dan role tak dikenal', async () => {
    const valid = {
      name: 'Baru',
      email: 'Baru@contoh.test',
      password: 'Niskala2026!',
      role_id: USER,
    }

    expect((await call('/api/v1/users', 'POST', { ...valid, password: 'pendek' })).status).toBe(400)
    expect((await call('/api/v1/users', 'POST', { ...valid, role_id: 'x' })).status).toBe(400)
    expect(
      (await call('/api/v1/users', 'POST', { ...valid, email: 'admin@contoh.test' })).status,
    ).toBe(409)
    const created = await call('/api/v1/users', 'POST', valid)
    expect(created.status).toBe(201)
    expect((await json(created)).email).toBe('baru@contoh.test')
    expect((await json(await call('/api/v1/users'))).length).toBe(10)
  })

  it('TC-UI-F5-12: ubah pengguna: akun sendiri dan SuperAdmin aktif terakhir tidak bisa diturunkan atau dinonaktifkan (409)', async () => {
    expect((await call(`/api/v1/users/${ME}`, 'PATCH', { is_active: false })).status).toBe(409)
    expect((await call(`/api/v1/users/${ME}`, 'PATCH', { role_id: USER })).status).toBe(409)
    expect((await call(`/api/v1/users/${ME}`, 'PATCH', { name: 'Nama Baru' })).status).toBe(200)
    expect((await call(`/api/v1/users/${ME}`, 'PATCH', {})).status).toBe(400)
    expect((await call(`/api/v1/users/${ME}`, 'PATCH', { email: 'rina@contoh.test' })).status).toBe(
      409,
    )
    expect(
      (
        await call('/api/v1/users/00000000-0000-4000-8000-000000000004', 'PATCH', {
          is_active: false,
        })
      ).status,
    ).toBe(200)
  })

  it('TC-UI-F5-13: hapus pengguna: akun sendiri 409, lainnya 204 lalu 404', async () => {
    expect((await call(`/api/v1/users/${ME}`, 'DELETE')).status).toBe(409)
    const other = '00000000-0000-4000-8000-000000000012'
    expect((await call(`/api/v1/users/${other}`, 'DELETE')).status).toBe(204)
    expect((await call(`/api/v1/users/${other}`)).status).toBe(404)
  })

  it('TC-UI-F5-14: role sistem 403 pada PATCH/DELETE; role kustom dipakai 409; role baru bisa diubah dan dihapus', async () => {
    expect((await call(`/api/v1/roles/${SUPERADMIN}`, 'PATCH', { name: 'Lain' })).status).toBe(403)
    expect((await call(`/api/v1/roles/${USER}`, 'PATCH', { description: 'x' })).status).toBe(403)
    expect((await call(`/api/v1/roles/${USER}`, 'DELETE')).status).toBe(403)
    expect((await call(`/api/v1/roles/${OPERATOR}`, 'DELETE')).status).toBe(409)

    expect((await call('/api/v1/roles', 'POST', { name: 'ab' })).status).toBe(400)
    expect((await call('/api/v1/roles', 'POST', { name: 'operator' })).status).toBe(409)
    const created = await json(
      await call('/api/v1/roles', 'POST', { name: 'Tamu Khusus', description: 'uji' }),
    )
    expect(
      (await json(await call(`/api/v1/roles/${created.id}`, 'PATCH', { name: 'Tamu Baru' }))).name,
    ).toBe('Tamu Baru')
    expect((await call(`/api/v1/roles/${created.id}`, 'DELETE')).status).toBe(204)
  })

  it('TC-UI-F5-15: katalog dan set izin/menu: PUT mengganti seluruh set; SuperAdmin 403; kode tak dikenal 400', async () => {
    expect((await json(await call('/api/v1/permissions?limit=100'))).length).toBe(10)
    expect((await json(await call('/api/v1/menus?limit=100'))).length).toBe(13)
    expect((await json(await call(`/api/v1/roles/${SUPERADMIN}/permissions`))).permissions).toEqual(
      [],
    )

    const put = (kind: string, body: unknown, id = USER) =>
      call(`/api/v1/roles/${id}/${kind}`, 'PUT', body)
    const saved = await json(await put('permissions', { permissions: ['templates.read'] }))
    expect(saved.permissions).toEqual(['templates.read'])
    expect((await json(await call(`/api/v1/roles/${USER}/permissions`))).permissions).toEqual([
      'templates.read',
    ])
    expect(
      (await put('permissions', { permissions: ['templates.read', 'templates.read'] })).status,
    ).toBe(400)
    expect((await put('permissions', { permissions: ['tidak.ada'] })).status).toBe(400)
    expect((await put('menus', { menus: ['tidak.ada'] })).status).toBe(400)
    expect((await put('menus', { menus: ['app.home'] })).status).toBe(200)
    expect((await put('permissions', { permissions: [] }, SUPERADMIN)).status).toBe(403)
  })

  it('TC-UI-F5-16: dashboard mock butuh token, mode empty mengosongkan data', async () => {
    const unauthenticated = window.fetch('/api/v1/dashboard/activity')
    await vi.advanceTimersByTimeAsync(5000)
    expect((await unauthenticated).status).toBe(401)
    expect((await json(await call('/api/v1/dashboard/registrations'))).length).toBe(5)
    expect((await json(await call('/api/v1/dashboard/top-templates')))[0].name).toBe('Rustic Hijau')
    expect((await json(await call('/api/v1/dashboard/invitations'))).invitations_active).toBe(128)

    window.__nkMock = 'empty'
    expect(await json(await call('/api/v1/dashboard/activity'))).toEqual([])
    expect(await json(await call('/api/v1/users'))).toEqual([])
    window.__nkMock = 'forbidden'
    expect((await call('/api/v1/roles')).status).toBe(403)
  })
})

describe('mock menyerupai pesan dan data backend', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}')) as unknown as typeof window.fetch
    installMockApi()
  })

  afterEach(() => {
    vi.useRealTimers()
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
  const message = async (res: Response) => (await res.json()).message
  const ME = '00000000-0000-4000-8000-000000000001'
  const SUPERADMIN = '00000000-0000-4000-8000-0000000000a1'
  const USER = '00000000-0000-4000-8000-0000000000a2'

  it('TC-UI-F5-67: pesan 409 dan 403 sama dengan backend', async () => {
    expect(await message(await call(`/api/v1/users/${ME}`, 'DELETE'))).toBe(
      'You cannot deactivate, demote, or delete yourself',
    )
    expect(await message(await call(`/api/v1/roles/${SUPERADMIN}`, 'DELETE'))).toBe(
      'Role SuperAdmin cannot be modified or deleted',
    )
    expect(await message(await call(`/api/v1/roles/${USER}`, 'PATCH', { name: 'Lain' }))).toBe(
      'Role User cannot be modified or deleted',
    )
    expect(
      await message(await call(`/api/v1/users/${ME}`, 'PATCH', { email: 'rina@contoh.test' })),
    ).toBe('Email already registered')
  })

  it('TC-UI-F5-68: /auth/me SuperAdmin berisi seluruh katalog izin', async () => {
    const me = (await (await call('/api/v1/auth/me')).json()).data
    const catalog = (await (await call('/api/v1/permissions?limit=100')).json()).data

    expect(me.permissions).toHaveLength(10)
    expect(me.permissions).toEqual(catalog.map((p: { code: string }) => p.code))
  })
})
