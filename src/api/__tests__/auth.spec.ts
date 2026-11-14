import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getMe, login, logout } from '../auth'
import { ApiError, refreshAccessToken, setSessionExpiredCallback } from '../http'
import { clearSession, getAccessToken, getRefreshToken, setSession } from '../token'
import type { MeResponse, TokenResponse } from '@/types/auth'

const tokens: TokenResponse = {
  access_token: 'access-1', // secret-scan:ignore fake value
  refresh_token: 'refresh-1', // secret-scan:ignore fake value
  token_type: 'Bearer',
  expires_in: 1800,
}

const profile: MeResponse = {
  id: 'f2a6c1f0-0000-4000-8000-000000000001',
  name: 'Super Administrator',
  email: 'superadmin@example.com',
  role: { id: 'role-superadmin', name: 'SuperAdmin' },
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }

function jsonResponse(status: number, data: unknown, message = ''): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ code: status, status: 'ok', message, data }),
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

describe('login()', () => {
  it('TC-UNIT-07: sends { email, password } and stores both tokens on success', async () => {
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      expect(url).toBe('/api/v1/auth/login')
      expect(JSON.parse(init?.body as string)).toEqual({
        email: 'superadmin@example.com',
        password: 'Password123!',
      })
      return jsonResponse(200, tokens)
    })
    vi.stubGlobal('fetch', fetchMock)

    await login('superadmin@example.com', 'Password123!')

    expect(getAccessToken()).toBe(tokens.access_token)
    expect(getRefreshToken()).toBe(tokens.refresh_token)
  })

  it('TC-UNIT-08: a 400 response never carries the backend validation message', async () => {
    const fetchMock = vi.fn<FetchMock>(async () =>
      jsonResponse(400, null, 'leak: invalid email syntax at column 5'),
    )
    vi.stubGlobal('fetch', fetchMock)

    const err = await login('bad@example.com', 'pwd').catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(400)
    expect(err.message).toBe('Permintaan API gagal dengan status 400.')
    expect(err.message).not.toContain('leak')
    expect(getAccessToken()).toBeNull()
  })

  it('TC-UNIT-09: a 401 never carries the backend message, even when it contains markup', async () => {
    const fetchMock = vi.fn<FetchMock>(async () =>
      jsonResponse(401, null, '<script>alert(1)</script>invalid credential'),
    )
    vi.stubGlobal('fetch', fetchMock)

    const err = await login('admin@example.com', 'salah').catch((e) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(err.message).not.toContain('<script>')
    expect(getAccessToken()).toBeNull()
  })

  it('TC-UNIT-10: network failure, 500, and 503 all reject with a generic ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    const netErr = await login('admin@example.com', 'pwd').catch((e) => e)
    expect(netErr).toBeInstanceOf(ApiError)
    expect(netErr.status).toBe(0)

    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => jsonResponse(500, null, 'database error')),
    )
    const err500 = await login('admin@example.com', 'pwd').catch((e) => e)
    expect(err500.status).toBe(500)
    expect(err500.message).not.toContain('database')

    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => jsonResponse(503, null, 'service unavailable')),
    )
    const err503 = await login('admin@example.com', 'pwd').catch((e) => e)
    expect(err503.status).toBe(503)
  })
})

describe('refreshAccessToken()', () => {
  it('TC-UNIT-11: sends { refresh_token } and stores the rotated tokens', async () => {
    setSession(tokens)
    const rotatedTokens: TokenResponse = {
      access_token: 'access-2', // secret-scan:ignore fake value
      refresh_token: 'refresh-2', // secret-scan:ignore fake value
      token_type: 'Bearer',
      expires_in: 1800,
    }
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      expect(url).toBe('/api/v1/auth/refresh')
      expect(init?.headers).not.toHaveProperty('Authorization')
      expect(JSON.parse(init?.body as string)).toEqual({ refresh_token: tokens.refresh_token })
      return jsonResponse(200, rotatedTokens)
    })
    vi.stubGlobal('fetch', fetchMock)

    const refreshed = await refreshAccessToken()

    expect(refreshed).toBe(true)
    expect(getAccessToken()).toBe(rotatedTokens.access_token)
    expect(getRefreshToken()).toBe(rotatedTokens.refresh_token)
  })

  it('TC-UNIT-12: without a stored refresh token, POST /auth/refresh is never called', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)

    const refreshed = await refreshAccessToken()

    expect(refreshed).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('logout()', () => {
  it('TC-UNIT-13: sends the Bearer header, refresh token body, and clears session on success', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      expect(url).toBe('/api/v1/auth/logout')
      expect(authHeader(init)).toBe(`Bearer ${tokens.access_token}`)
      expect(JSON.parse(init?.body as string)).toEqual({ refresh_token: tokens.refresh_token })
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)

    await logout()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('TC-UNIT-14: a 401 still clears the session', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse(401, null))
    vi.stubGlobal('fetch', fetchMock)

    await logout()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('TC-UNIT-15: a 403 still clears the session', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse(403, null))
    vi.stubGlobal('fetch', fetchMock)

    await logout()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe('getMe()', () => {
  it('TC-UNIT-18: sends the Bearer header and returns the user profile contract', async () => {
    setSession(tokens)
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      expect(url).toBe('/api/v1/auth/me')
      expect(authHeader(init)).toBe(`Bearer ${tokens.access_token}`)
      return jsonResponse(200, profile)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMe()

    expect(result).toEqual(profile)
  })

  it('TC-UNIT-19: a mid-use 401 triggers exactly one refresh, then retries with the new token', async () => {
    setSession(tokens)
    const newTokens: TokenResponse = {
      access_token: 'access-new', // secret-scan:ignore fake value
      refresh_token: 'refresh-new', // secret-scan:ignore fake value
      token_type: 'Bearer',
      expires_in: 1800,
    }
    const headersSent: Array<string | undefined> = []
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      if (url === '/api/v1/auth/refresh') {
        return jsonResponse(200, newTokens)
      }
      if (url === '/api/v1/auth/me') {
        headersSent.push(authHeader(init))
        return headersSent.length === 1 ? jsonResponse(401, null) : jsonResponse(200, profile)
      }
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMe()

    expect(result).toEqual(profile)
    expect(headersSent).toEqual([
      `Bearer ${tokens.access_token}`,
      `Bearer ${newTokens.access_token}`,
    ])
  })
})
