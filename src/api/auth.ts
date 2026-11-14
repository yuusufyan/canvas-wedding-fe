import type { LoginRequest, MeResponse, TokenResponse } from '@/types/auth'
import { apiRequest } from './http'
import { clearSession, getRefreshToken, setSession } from './token'

export async function login(email: string, password: string): Promise<void> {
  const body: LoginRequest = { email, password }
  const tokens = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body,
    skipAuth: true,
    skipRetry: true,
  })
  setSession(tokens)
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await apiRequest<null>('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken },
        notifySessionExpired: false,
      })
    }
  } catch {
    // Session ends locally regardless of API outcome
  } finally {
    clearSession()
  }
}

export async function getMe(options?: { skipRetry?: boolean }): Promise<MeResponse> {
  try {
    return await apiRequest<MeResponse>('/auth/me', {
      method: 'GET',
      skipRetry: options?.skipRetry ?? false,
    })
  } catch (error) {
    clearSession()
    throw error
  }
}
