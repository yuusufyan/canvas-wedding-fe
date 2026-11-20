import type { ApiEnvelope, PaginationMeta } from '@/types/api'

// Mode uji manual/E2E (hanya ada saat dev + mock), diisi lewat window.__nkMock:
// - empty, error, slow, forbidden: data admin dan publik
// - rate-limit: login, register, verify-email, resend-verification menjawab 429
// - unverified: login dengan kredensial benar menjawab 403 (email belum diverifikasi)
// - token-expired: verify-email menjawab 400 untuk token apa pun
// - network: semua permintaan API gagal seperti jaringan terputus
declare global {
  interface Window {
    __nkMock?:
      | 'empty'
      | 'error'
      | 'slow'
      | 'forbidden'
      | 'rate-limit'
      | 'unverified'
      | 'token-expired'
      | 'network'
  }
}

export const MOCK_ACCESS_TOKEN = 'mock-access-token' // secret-scan:ignore nilai palsu untuk dev
export const MOCK_REFRESH_TOKEN = 'mock-refresh-token' // secret-scan:ignore nilai palsu untuk dev

const DEFAULT_DELAY_MS = 250
const SLOW_DELAY_MS = 4000

export interface MockRequest {
  url: URL
  method: string
  headers: Headers
  body: unknown
}

export type MockHandler = (request: MockRequest) => Promise<Response | null> | Response | null

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function ok<T>(data: T, meta?: PaginationMeta): Response {
  const envelope: ApiEnvelope<T> = { code: 200, status: 'OK', message: 'OK', data, meta }
  return json(200, envelope)
}

export function fail(status: number, message: string): Response {
  return json(status, { code: status, status: 'error', message })
}

export function wait(): Promise<void> {
  const ms = window.__nkMock === 'slow' ? SLOW_DELAY_MS : DEFAULT_DELAY_MS
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function paginate<T>(rows: T[], url: URL, defaultLimit = 10): Response {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? defaultLimit)))
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const start = (page - 1) * limit
  const meta: PaginationMeta = {
    total: rows.length,
    page,
    limit,
    total_pages: Math.ceil(rows.length / limit),
    total_results: rows.length,
  }
  return ok(rows.slice(start, start + limit), meta)
}

// Endpoint terautentikasi: butuh bearer token palsu; mode error/forbidden berlaku di sini.
export function guard(request: MockRequest): Response | null {
  if (request.headers.get('Authorization') !== `Bearer ${MOCK_ACCESS_TOKEN}`) {
    return fail(401, 'Unauthorized')
  }
  if (window.__nkMock === 'forbidden') {
    return fail(403, 'Forbidden')
  }
  if (window.__nkMock === 'error') {
    return fail(500, 'Internal Server Error')
  }
  return null
}
