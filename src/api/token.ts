import type { TokenResponse } from '@/types/auth'

// Opt A (security.md, Gerbang 1): refresh token lives in one sessionStorage
// key, access token only ever in this module-level variable. Neither is
// copied into Pinia state or any other module.
const REFRESH_TOKEN_STORAGE_KEY = 'canvas-wedding.refresh-token'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
}

export function setSession(tokens: TokenResponse): void {
  accessToken = tokens.accessToken
  sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
}

export function clearSession(): void {
  accessToken = null
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}
