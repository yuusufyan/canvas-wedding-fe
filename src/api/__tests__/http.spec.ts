import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  apiRequest,
  apiRequestPaginated,
  ApiError,
  refreshAccessToken,
  setSessionExpiredCallback,
} from '../http'
import { clearSession, getAccessToken, getRefreshToken, setSession } from '../token'
import type { TokenResponse } from '@/types/auth'

const oldTokens: TokenResponse = {
  access_token: 'old-token', // secret-scan:ignore fake value
  refresh_token: 'refresh-old', // secret-scan:ignore fake value
  token_type: 'Bearer',
  expires_in: 1800,
}

const newTokens: TokenResponse = {
  access_token: 'new-token', // secret-scan:ignore fake value
  refresh_token: 'refresh-new', // secret-scan:ignore fake value
  token_type: 'Bearer',
  expires_in: 1800,
}

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }

function jsonResponse(status: number, data: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ code: status, status: 'ok', message: '', data }),
  }
}

function authHeader(init?: RequestInit): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.Authorization
}

type FetchMock = (url: string, init?: RequestInit) => Promise<MockResponse>

beforeEach(() => {
  clearSession()
  setSessionExpiredCallback(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('TC-UNIT-01: attaches Authorization only to relative paths under the base API', async () => {
    setSession(oldTokens)
    const fetchMock = vi.fn<FetchMock>(async (_url, _init) => jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/auth/me', { method: 'GET' })
    await apiRequest('https://other-origin.example/resource', { method: 'GET' })

    const [firstCall, secondCall] = fetchMock.mock.calls
    expect(fetchMock.mock.calls).toHaveLength(2)
    if (!firstCall || !secondCall) {
      throw new Error('expected exactly two fetch calls')
    }
    expect(firstCall[0]).toBe('/api/v1/auth/me')
    expect(authHeader(firstCall[1])).toBe('Bearer old-token')
    expect(secondCall[0]).toBe('https://other-origin.example/resource')
    expect(authHeader(secondCall[1])).toBeUndefined()
  })

  it('TC-UNIT-02: refreshes exactly once for three concurrent 401s, then retries all three', async () => {
    setSession(oldTokens)
    let refreshCalls = 0
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse(200, newTokens)
      }
      if (authHeader(init) === 'Bearer old-token') {
        return jsonResponse(401, null)
      }
      return jsonResponse(200, { url })
    })
    vi.stubGlobal('fetch', fetchMock)

    const results = await Promise.all([
      apiRequest('/a', { method: 'GET' }),
      apiRequest('/b', { method: 'GET' }),
      apiRequest('/c', { method: 'GET' }),
    ])

    expect(refreshCalls).toBe(1)
    expect(results).toEqual([{ url: '/api/v1/a' }, { url: '/api/v1/b' }, { url: '/api/v1/c' }])
    expect(getAccessToken()).toBe('new-token')
  })

  it('TC-UNIT-03: a request whose token was already rotated elsewhere retries directly, without a refresh call', async () => {
    setSession(oldTokens)
    let refreshCalls = 0
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse(200, newTokens)
      }
      if (authHeader(init) === 'Bearer old-token') {
        // Simulate another in-flight call rotating the session before this
        // request's response arrives.
        setSession(newTokens)
        return jsonResponse(401, null)
      }
      return jsonResponse(200, { ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiRequest('/orders', { method: 'GET' })

    expect(result).toEqual({ ok: true })
    expect(refreshCalls).toBe(0)
  })

  it('TC-UNIT-04: the refresh token is overwritten before the original request is replayed, and the old value is rejected', async () => {
    setSession(oldTokens)
    const consumedRefreshTokens = new Set<string>()
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      if (url === '/api/v1/auth/refresh') {
        const body = JSON.parse(init?.body as string) as { refresh_token: string }
        if (consumedRefreshTokens.has(body.refresh_token)) {
          return jsonResponse(401, null)
        }
        consumedRefreshTokens.add(body.refresh_token)
        return jsonResponse(200, newTokens)
      }
      if (authHeader(init) === 'Bearer old-token') {
        return jsonResponse(401, null)
      }
      expect(getRefreshToken()).toBe('refresh-new')
      return jsonResponse(200, { ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/orders', { method: 'GET' })

    expect(getRefreshToken()).toBe('refresh-new')
    const staleRefreshCall = await apiRequest<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: 'refresh-old' },
      skipAuth: true,
      skipRetry: true,
    }).catch((error: unknown) => error)
    expect(staleRefreshCall).toBeInstanceOf(ApiError)
  })

  it('TC-UNIT-05: a failed refresh clears the session and fires the session-expired callback once', async () => {
    setSession(oldTokens)
    const expiredCallback = vi.fn<() => void>()
    setSessionExpiredCallback(expiredCallback)
    let refreshCalls = 0
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse(401, null)
      }
      return jsonResponse(401, null)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/orders', { method: 'GET' })).rejects.toBeInstanceOf(ApiError)

    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(expiredCallback).toHaveBeenCalledTimes(1)
  })

  it('TC-UNIT-06: a 401 on login/refresh itself never triggers a nested refresh', async () => {
    setSession(oldTokens)
    let refreshCalls = 0
    const fetchMock = vi.fn<FetchMock>(async (url) => {
      if (url === '/api/v1/auth/refresh') {
        refreshCalls += 1
        return jsonResponse(401, null)
      }
      if (url === '/api/v1/auth/login') {
        return jsonResponse(401, null)
      }
      return jsonResponse(200, { ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      apiRequest('/auth/login', {
        method: 'POST',
        body: { identifier: 'a', password: 'b' },
        skipAuth: true,
        skipRetry: true,
      }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(refreshCalls).toBe(0)

    const refreshed = await refreshAccessToken()
    expect(refreshed).toBe(false)
    expect(refreshCalls).toBe(1)
  })

  it('TC-UI-F5-61: daftar tanpa key data (omitempty) menjadi array kosong dengan meta bawaan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ code: 200, status: 'OK', message: 'ok' }),
      })),
    )

    const result = await apiRequestPaginated<{ id: string }>('/users', { method: 'GET' })

    expect(result.data).toEqual([])
    expect(result.meta.total).toBe(0)
  })

  it('TC-UI-F5-62: ApiError membawa message BE hanya sebagai serverMessage, bukan sebagai message error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => ({
        ok: false,
        status: 409,
        json: async () => ({ code: 409, status: 'error', message: 'Email already registered' }),
      })),
    )

    const error = await apiRequest('/users', { method: 'POST', body: {} }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).serverMessage).toBe('Email already registered')
    expect((error as ApiError).message).toBe('Permintaan API gagal dengan status 409.')
  })

  it('TC-UI-F5-63: body error yang bukan JSON tidak memecahkan ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('bukan json')
        },
      })),
    )

    const error = await apiRequest('/users', { method: 'GET' }).catch((e: unknown) => e)

    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).serverMessage).toBeUndefined()
  })
})
