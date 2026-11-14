import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, setSession } from '../token'
import { createRole, deleteRole, getRole, listRoles, updateRole } from '../roles'
import { createUser, deleteUser, getUser, listUsers, updateUser } from '../users'
import type { User } from '@/types/user'
import type { Role } from '@/types/role'

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }
type FetchMock = (url: string, init?: RequestInit) => Promise<MockResponse>

const meta = { total: 1, page: 1, limit: 10, total_pages: 1, total_results: 1 }

const sampleUser: User = {
  id: 'u-1',
  name: 'Sales Person',
  email: 'sales@example.com',
  role: { id: 'r-1', name: 'sales' },
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const sampleRole: Role = {
  id: 'r-2',
  name: 'supervisor',
  description: 'Role pengawas',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function ok(data: unknown, withMeta = false): MockResponse {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      code: 200,
      status: 'success',
      message: 'OK',
      data,
      ...(withMeta && { meta }),
    }),
  }
}

function lastCall(fetchMock: ReturnType<typeof vi.fn<FetchMock>>) {
  const [url, init] = fetchMock.mock.lastCall ?? ['', undefined]
  return { url, method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined }
}

describe('user management API', () => {
  let fetchMock: ReturnType<typeof vi.fn<FetchMock>>

  beforeEach(() => {
    setSession({
      access_token: 'acc-1', // secret-scan:ignore fake value
      refresh_token: 'ref-1', // secret-scan:ignore fake value
      token_type: 'Bearer',
      expires_in: 1800,
    })
    fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    clearSession()
    vi.restoreAllMocks()
  })

  it('calls the users endpoints with the documented method, path, and body', async () => {
    fetchMock.mockResolvedValueOnce(ok([sampleUser], true))
    const list = await listUsers({ page: 0, limit: 500 })
    expect(list.data).toEqual([sampleUser])
    expect(lastCall(fetchMock).url).toContain('/users?page=1&limit=100')

    fetchMock.mockResolvedValueOnce(ok(sampleUser))
    expect(await getUser('u-1')).toEqual(sampleUser)
    expect(lastCall(fetchMock).url).toContain('/users/u-1')

    fetchMock.mockResolvedValueOnce(ok(sampleUser))
    const body = {
      name: 'Super Admin',
      email: 'a@example.com',
      password: 'x'.repeat(12),
      role_id: 'r-1',
    }
    expect(await createUser(body)).toEqual(sampleUser)
    expect(lastCall(fetchMock)).toMatchObject({ method: 'POST', body })

    fetchMock.mockResolvedValueOnce(ok(sampleUser))
    await updateUser('u-1', { role_id: 'r-2', is_active: false })
    expect(lastCall(fetchMock)).toMatchObject({
      method: 'PATCH',
      body: { role_id: 'r-2', is_active: false },
    })
    expect(lastCall(fetchMock).url).toContain('/users/u-1')

    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })
    expect(await deleteUser('u-1')).toBeNull()
    expect(lastCall(fetchMock).method).toBe('DELETE')
  })

  it('calls the roles endpoints with the documented method, path, and body', async () => {
    fetchMock.mockResolvedValueOnce(ok([sampleRole], true))
    expect((await listRoles()).data).toEqual([sampleRole])
    expect(lastCall(fetchMock).url).toContain('/roles?page=1&limit=10')

    fetchMock.mockResolvedValueOnce(ok(sampleRole))
    expect(await getRole('r-2')).toEqual(sampleRole)
    expect(lastCall(fetchMock).url).toContain('/roles/r-2')

    fetchMock.mockResolvedValueOnce(ok(sampleRole))
    await createRole({ name: 'supervisor', description: 'Pengawas' })
    expect(lastCall(fetchMock)).toMatchObject({
      method: 'POST',
      body: { name: 'supervisor', description: 'Pengawas' },
    })

    fetchMock.mockResolvedValueOnce(ok(sampleRole))
    await updateRole('r-2', { description: 'Pengawas Lapangan' })
    expect(lastCall(fetchMock)).toMatchObject({
      method: 'PATCH',
      body: { description: 'Pengawas Lapangan' },
    })

    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })
    expect(await deleteRole('r-2')).toBeNull()
    expect(lastCall(fetchMock).method).toBe('DELETE')
  })
})
