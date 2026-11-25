import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { register, resendVerification, verifyEmail } from '../auth'
import { installMockApi } from '../mock'
import { API_BASE_URL } from '@/constants/api'

describe('API registrasi dan aktivasi', () => {
  let fetchMock: Mock<typeof fetch>

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 202, status: 'Accepted', message: '', data: null }), {
        status: 202,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function lastCall(): [string, RequestInit] {
    const calls = fetchMock.mock.calls
    return calls[calls.length - 1] as [string, RequestInit]
  }

  it('TC-UI-F4-11: register mengirim POST tanpa Authorization dan menerima 202 tanpa data', async () => {
    await expect(
      register({ name: 'Hilda', email: 'hilda@contoh.test', password: 'Niskala2026!' }), // secret-scan:ignore nilai palsu untuk test
    ).resolves.toBeUndefined()

    const [url, init] = lastCall()
    expect(url).toBe(`${API_BASE_URL}/auth/register`)
    expect(init.method).toBe('POST')
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('TC-UI-F4-12: token aktivasi dikirim di body POST, tidak pernah di URL', async () => {
    const token = 'T'.repeat(43)

    await verifyEmail(token)

    const [url, init] = lastCall()
    expect(url).toBe(`${API_BASE_URL}/auth/verify-email`)
    expect(url).not.toContain(token)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ token })
  })

  it('TC-UI-F4-13: resend-verification mengirim email di body dan 400 diteruskan sebagai ApiError', async () => {
    await resendVerification('hilda@contoh.test')
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/auth/resend-verification`)
    expect(JSON.parse(String(lastCall()[1].body))).toEqual({ email: 'hilda@contoh.test' })

    fetchMock.mockResolvedValue(new Response('{}', { status: 400 }))
    await expect(resendVerification('x')).rejects.toMatchObject({ status: 400 })
  })
})

describe('mock registrasi dan aktivasi', () => {
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

  async function post(path: string, body: unknown) {
    const pending = window.fetch(path, { method: 'POST', body: JSON.stringify(body) })
    await vi.advanceTimersByTimeAsync(5000)
    return pending
  }

  const valid = { name: 'Hilda', email: 'hilda@contoh.test', password: 'Niskala2026!' } // secret-scan:ignore nilai palsu untuk test

  it('TC-UI-F4-14: register menjawab 202 identik untuk email baru dan email yang sudah terdaftar', async () => {
    const fresh = await post(`${API_BASE_URL}/auth/register`, valid)
    const existing = await post(`${API_BASE_URL}/auth/register`, {
      ...valid,
      email: 'admin@contoh.test',
    })

    expect(fresh.status).toBe(202)
    expect(existing.status).toBe(202)
    expect(await existing.text()).toBe(await fresh.text())
  })

  it('TC-UI-F4-15: register memvalidasi body (400) dengan aturan 8-72 byte', async () => {
    expect(
      (await post(`${API_BASE_URL}/auth/register`, { ...valid, password: 'pendek' })).status,
    ).toBe(400)
    expect(
      (await post(`${API_BASE_URL}/auth/register`, { ...valid, password: 'é'.repeat(37) })).status,
    ).toBe(400)
    expect((await post(`${API_BASE_URL}/auth/register`, { ...valid, name: ' ' })).status).toBe(400)
    expect((await post(`${API_BASE_URL}/auth/register`, { ...valid, email: 'bukan' })).status).toBe(
      400,
    )
  })

  it('TC-UI-F4-16: verify-email: token valid 200; format salah, kedaluwarsa, dan mode token-expired 400', async () => {
    const good = 'A'.repeat(43)
    expect((await post(`${API_BASE_URL}/auth/verify-email`, { token: good })).status).toBe(200)
    expect((await post(`${API_BASE_URL}/auth/verify-email`, { token: 'pendek' })).status).toBe(400)
    expect(
      (await post(`${API_BASE_URL}/auth/verify-email`, { token: 'x'.repeat(43) })).status,
    ).toBe(400)

    window.__nkMock = 'token-expired'
    expect((await post(`${API_BASE_URL}/auth/verify-email`, { token: good })).status).toBe(400)
  })

  it('TC-UI-F4-17: resend selalu 202 untuk email berformat benar; mode rate-limit menjawab 429', async () => {
    expect(
      (await post(`${API_BASE_URL}/auth/resend-verification`, { email: 'siapa@contoh.test' }))
        .status,
    ).toBe(202)
    expect(
      (await post(`${API_BASE_URL}/auth/resend-verification`, { email: 'bukan' })).status,
    ).toBe(400)

    window.__nkMock = 'rate-limit'
    expect(
      (await post(`${API_BASE_URL}/auth/resend-verification`, { email: 'a@contoh.test' })).status,
    ).toBe(429)
    expect((await post(`${API_BASE_URL}/auth/register`, valid)).status).toBe(429)
  })
})
