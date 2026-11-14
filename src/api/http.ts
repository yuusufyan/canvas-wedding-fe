import { API_BASE_PATH } from '@/constants/api'
import type { ApiEnvelope, PaginatedResult, PaginationMeta } from '@/types/api'
import type { TokenResponse } from '@/types/auth'
import { clearSession, getAccessToken, getRefreshToken, setSession } from './token'

// Thrown by apiRequest for any non-2xx response or network failure. Carries
// only the status and a message generated here, never the response body or
// headers (SR-04) — the backend's `message` is never attached to this error.
export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Permintaan API gagal dengan status ${status}.`)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiRequestInit {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Login and refresh: never send the Authorization header. */
  skipAuth?: boolean
  /** Login, refresh, and bootstrap's own `me` call: never retry on 401. */
  skipRetry?: boolean
  /** Logout: a failed refresh here still ends the session, but must not
   *  surface the "sesi berakhir" notice meant for mid-use 401s. */
  notifySessionExpired?: boolean
}

type SessionExpiredCallback = () => void

let sessionExpiredCallback: SessionExpiredCallback | null = null

export function setSessionExpiredCallback(callback: SessionExpiredCallback): void {
  sessionExpiredCallback = callback
}

function isAbsoluteUrl(path: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//')
}

async function sendEnvelopeRequest<T>(
  url: string,
  init: ApiRequestInit,
  accessToken: string | null,
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {}
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError(0)
  }

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  if (response.status === 204) {
    return { code: 204, status: 'OK', message: '', data: null as T }
  }

  return (await response.json()) as ApiEnvelope<T>
}

function handleUnrecoverable401(init: ApiRequestInit): void {
  clearSession()
  if (init.notifySessionExpired !== false) {
    sessionExpiredCallback?.()
  }
}

async function retryEnvelopeWithCurrentToken<T>(
  url: string,
  init: ApiRequestInit,
): Promise<ApiEnvelope<T>> {
  try {
    return await sendEnvelopeRequest<T>(url, init, getAccessToken())
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleUnrecoverable401(init)
    }
    throw error
  }
}

// Single-flight promise shared by every caller that needs a refresh at the
// same time (SR-03), including useAuthStore().bootstrap().
let refreshPromise: Promise<boolean> | null = null

export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  try {
    const tokens = await apiRequest<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
      skipAuth: true,
      skipRetry: true,
    })
    setSession(tokens)
    return true
  } catch {
    clearSession()
    return false
  }
}

async function requestEnvelope<T>(path: string, init: ApiRequestInit): Promise<ApiEnvelope<T>> {
  const absolute = isAbsoluteUrl(path)
  const url = absolute ? path : `${API_BASE_PATH}${path}`
  const addAuth = !absolute && !init.skipAuth
  const tokenForRequest = addAuth ? getAccessToken() : null

  try {
    return await sendEnvelopeRequest<T>(url, init, tokenForRequest)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || init.skipRetry || !addAuth) {
      throw error
    }

    // A concurrent request already refreshed the token for us: replay with
    // the current token instead of starting a second refresh (SR-03).
    if (getAccessToken() !== tokenForRequest && getAccessToken() !== null) {
      return retryEnvelopeWithCurrentToken<T>(url, init)
    }

    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      handleUnrecoverable401(init)
      throw error
    }

    return retryEnvelopeWithCurrentToken<T>(url, init)
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit): Promise<T> {
  const envelope = await requestEnvelope<T>(path, init)
  return envelope.data
}

const DEFAULT_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  total_pages: 0,
  total_results: 0,
}

export async function apiRequestPaginated<T>(
  path: string,
  init: ApiRequestInit,
): Promise<PaginatedResult<T>> {
  const envelope = await requestEnvelope<T[]>(path, init)
  return {
    data: envelope.data,
    meta: envelope.meta ?? DEFAULT_META,
  }
}
