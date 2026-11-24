import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { buildQuery } from '../query'
import {
  archiveTemplate,
  createTemplate,
  deleteTemplate,
  getTemplateCounts,
  listTemplates,
  publishTemplate,
  updateTemplate,
} from '../templates'
import { getMembershipSummary, listMemberships } from '../memberships'
import { clearSession, setSession } from '../token'
import { API_BASE_URL } from '@/constants/api'

function envelope(data: unknown, meta = false): Response {
  return new Response(
    JSON.stringify({
      code: 200,
      status: 'OK',
      message: 'OK',
      data,
      ...(meta && { meta: { total: 1, page: 1, limit: 12, total_pages: 1, total_results: 1 } }),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('buildQuery', () => {
  it('TC-UI-F3-07: membuang nilai kosong, menjepit page dan limit ke 1..100', () => {
    expect(buildQuery({ page: 0, limit: 500, q: '', status: undefined, sort: 'name_asc' })).toBe(
      '?page=1&limit=100&sort=name_asc',
    )
    expect(buildQuery({ page: 3, limit: -4 })).toBe('?page=3&limit=1')
    expect(buildQuery({})).toBe('')
  })
})

describe('API admin template dan membership', () => {
  let fetchMock: Mock<typeof fetch>

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
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

  it('TC-UI-F3-08: daftar template memakai paginasi server dan filter, dengan bearer token', async () => {
    fetchMock.mockResolvedValue(envelope([], true))

    await listTemplates({ page: 2, limit: 12, status: 'Draft', access: 'Premium', q: 'rustic' })

    const [url, init] = lastCall()
    expect(url).toBe(
      `${API_BASE_URL}/templates?page=2&limit=12&status=Draft&access=Premium&q=rustic`,
    )
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('TC-UI-F3-09: aksi template memakai method dan path yang benar', async () => {
    fetchMock.mockImplementation(async () => envelope({ id: 'a/b' }))

    await getTemplateCounts()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/templates/counts`)

    await createTemplate({ name: 'Baru', access: 'Gratis' })
    expect(lastCall()[1].method).toBe('POST')
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ name: 'Baru', access: 'Gratis' })

    await updateTemplate('a/b', { access: 'Premium' })
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/templates/a%2Fb`)
    expect(lastCall()[1].method).toBe('PATCH')

    await publishTemplate('x')
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/templates/x/publish`)
    await archiveTemplate('x')
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/templates/x/archive`)

    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await deleteTemplate('x')
    expect(lastCall()[1].method).toBe('DELETE')
  })

  it('TC-UI-F3-10: membership: daftar berpaginasi dan ringkasan', async () => {
    fetchMock.mockResolvedValue(envelope([], true))
    await listMemberships({ page: 1, limit: 10, status: 'Aktif', q: 'nadia' })
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/memberships?page=1&limit=10&status=Aktif&q=nadia`)

    fetchMock.mockResolvedValue(envelope({ total: 1 }))
    await getMembershipSummary()
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/memberships/summary`)
  })
})
