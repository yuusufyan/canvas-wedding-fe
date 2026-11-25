import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getMe, login, logout } from '../auth'
import { ApiError, refreshAccessToken, setSessionExpiredCallback } from '../http'
import { clearSession, getAccessToken, getRefreshToken, setSession } from '../token'
import type { MeResponse, TokenResponse } from '@/types/auth'
import { API_BASE_URL } from '@/constants/api'

const tokens: TokenResponse = {
  accessToken: 'access-1', // secret-scan:ignore fake value
  refreshToken: 'refresh-1', // secret-scan:ignore fake value
  tokenType: 'Bearer',
  expiresIn: 1800,
}

const profile: MeResponse = {
  id: 'f2a6c1f0-0000-4000-8000-000000000001',
  name: 'Super Administrator',
  email: 'superadmin@example.com',
  role: 'superadmin',
  permissions: ['users.manage'],
  menus: [],
}

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }

function jsonResponse(status: number, data: unknown, message = ''): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    // Backend NestJS: envelope nest-common { code, status, message, data }.
    json: async () => ({ code: status, status: status < 400 ? 'success' : 'error', message, data }),
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
      expect(url).toBe(`${API_BASE_URL}/auth/login`)
      expect(JSON.parse(init?.body as string)).toEqual({
        email: 'superadmin@example.com',
        password: 'Password123!',
      })
      return jsonResponse(200, tokens)
    })
    vi.stubGlobal('fetch', fetchMock)

    await login('superadmin@example.com', 'Password123!')

    expect(getAccessToken()).toBe(tokens.accessToken)
    expect(getRefreshToken()).toBe(tokens.refreshToken)
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
  it('TC-UNIT-11: sends { refreshToken } and stores the rotated tokens', async () => {
    setSession(tokens)
    const rotatedTokens: TokenResponse = {
      accessToken: 'access-2', // secret-scan:ignore fake value
      refreshToken: 'refresh-2', // secret-scan:ignore fake value
      tokenType: 'Bearer',
      expiresIn: 1800,
    }
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      expect(url).toBe(`${API_BASE_URL}/auth/refresh`)
      expect(init?.headers).not.toHaveProperty('Authorization')
      expect(JSON.parse(init?.body as string)).toEqual({ refreshToken: tokens.refreshToken })
      return jsonResponse(200, rotatedTokens)
    })
    vi.stubGlobal('fetch', fetchMock)

    const refreshed = await refreshAccessToken()

    expect(refreshed).toBe(true)
    expect(getAccessToken()).toBe(rotatedTokens.accessToken)
    expect(getRefreshToken()).toBe(rotatedTokens.refreshToken)
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
      expect(url).toBe(`${API_BASE_URL}/auth/logout`)
      expect(authHeader(init)).toBe(`Bearer ${tokens.accessToken}`)
      expect(JSON.parse(init?.body as string)).toEqual({ refreshToken: tokens.refreshToken })
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
      expect(url).toBe(`${API_BASE_URL}/auth/me`)
      expect(authHeader(init)).toBe(`Bearer ${tokens.accessToken}`)
      return jsonResponse(200, profile)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMe()

    expect(result).toEqual(profile)
  })

  it('TC-UNIT-19: a mid-use 401 triggers exactly one refresh, then retries with the new token', async () => {
    setSession(tokens)
    const newTokens: TokenResponse = {
      accessToken: 'access-new', // secret-scan:ignore fake value
      refreshToken: 'refresh-new', // secret-scan:ignore fake value
      tokenType: 'Bearer',
      expiresIn: 1800,
    }
    const headersSent: Array<string | undefined> = []
    const fetchMock = vi.fn<FetchMock>(async (url, init) => {
      if (url === `${API_BASE_URL}/auth/refresh`) {
        return jsonResponse(200, newTokens)
      }
      if (url === `${API_BASE_URL}/auth/me`) {
        headersSent.push(authHeader(init))
        return headersSent.length === 1 ? jsonResponse(401, null) : jsonResponse(200, profile)
      }
      throw new Error(`unexpected url ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getMe()

    expect(result).toEqual(profile)
    expect(headersSent).toEqual([`Bearer ${tokens.accessToken}`, `Bearer ${newTokens.accessToken}`])
  })
})
