import type {
  LoginRequest,
  MeResponse,
  RegisterRequest,
  ResendVerificationRequest,
  TokenResponse,
  VerifyEmailRequest,
} from '@/types/auth'
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

// TODO(BE): register, verify-email, dan resend-verification belum ada di backend; bentuknya
// mengikuti draf auth-register-rbac dan dilayani src/api/mock saat dev. Registrasi dan kirim
// ulang selalu 202 identik (tidak membocorkan keberadaan akun), jadi tidak ada data yang dikembalikan.
export async function register(body: RegisterRequest): Promise<void> {
  await apiRequest<null>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
    skipRetry: true,
  })
}

// Token dikirim lewat body POST, tidak pernah lewat URL.
export async function verifyEmail(token: string): Promise<void> {
  const body: VerifyEmailRequest = { token }
  await apiRequest<null>('/auth/verify-email', {
    method: 'POST',
    body,
    skipAuth: true,
    skipRetry: true,
  })
}

export async function resendVerification(email: string): Promise<void> {
  const body: ResendVerificationRequest = { email }
  await apiRequest<null>('/auth/resend-verification', {
    method: 'POST',
    body,
    skipAuth: true,
    skipRetry: true,
  })
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
