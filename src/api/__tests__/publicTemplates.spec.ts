import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { getTemplateDemo, listPublicTemplates } from '../publicTemplates'
import { installMockApi } from '../mock'
import { clearSession, setSession } from '../token'
import { API_BASE_URL } from '@/constants/api'

type FetchMock = Mock<typeof fetch>

function envelope(data: unknown, withMeta = false): Response {
  return new Response(
    JSON.stringify({
      code: 200,
      status: 'OK',
      message: 'OK',
      data,
      ...(withMeta && { meta: { total: 1, page: 1, limit: 4, total_pages: 1, total_results: 1 } }),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('publicTemplates API', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    setSession({ accessToken: 'tok', refreshToken: 'ref', tokenType: 'Bearer', expiresIn: 60 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearSession()
  })

  it('TC-UI-F2-39: daftar template publik dipanggil tanpa header Authorization', async () => {
    fetchMock.mockResolvedValue(envelope([{ slug: 'rustic-hijau' }], true))

    const result = await listPublicTemplates(4)

    expect(result.data).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_BASE_URL}/public/templates?page=1&limit=4`)
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('TC-UI-F2-40: slug demo di-encode dan 404 diteruskan sebagai ApiError', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 404 }))

    await expect(getTemplateDemo('a b/c')).rejects.toMatchObject({ status: 404 })
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe(
      `${API_BASE_URL}/public/templates/a%20b%2Fc/demo`,
    )
  })
})

describe('mock API', () => {
  let realFetch: FetchMock

  beforeEach(() => {
    vi.useFakeTimers()
    realFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', realFetch)
    window.fetch = realFetch as unknown as typeof window.fetch
    installMockApi()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete window.__nkMock
  })

  async function call(path: string) {
    const pending = window.fetch(path)
    await vi.advanceTimersByTimeAsync(5000)
    return pending
  }

  it('TC-UI-F2-41: melayani daftar dan demo, meneruskan path lain ke fetch asli', async () => {
    const list = await call(`${API_BASE_URL}/public/templates?page=1&limit=2`)
    expect((await list.json()).data).toHaveLength(2)

    const demo = await call(`${API_BASE_URL}/public/templates/rustic-hijau/demo`)
    expect((await demo.json()).data.document.pages).toHaveLength(9)

    await call(`${API_BASE_URL}/tidak-dikenal`)
    expect(realFetch).toHaveBeenCalledTimes(1)
  })

  it('mock tidak mencegat origin lain, walau path-nya sama dengan endpoint backend', async () => {
    await call('https://other-origin.example/public/templates?page=1&limit=2')
    await call('https://other-origin.example/auth/me')
    expect(realFetch).toHaveBeenCalledTimes(2)
  })

  it('TC-UI-F2-42: mode empty, error, dan slug tidak dikenal', async () => {
    window.__nkMock = 'empty'
    expect((await (await call(`${API_BASE_URL}/public/templates?limit=4`)).json()).data).toEqual([])

    window.__nkMock = 'error'
    expect((await call(`${API_BASE_URL}/public/templates`)).status).toBe(500)

    delete window.__nkMock
    expect((await call(`${API_BASE_URL}/public/templates/tidak-ada/demo`)).status).toBe(404)
  })
})
