import { API_BASE_PATH } from '@/constants/api'
import { fail, json, type MockHandler } from './http'

const AUTH = `${API_BASE_PATH}/auth`

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
// Token berformat benar tetapi dianggap sudah kedaluwarsa/terpakai oleh mock.
export const MOCK_EXPIRED_TOKEN = 'x'.repeat(43)

function accepted(message: string): Response {
  return json(202, { code: 202, status: 'Accepted', message, data: null })
}

// Draf kontrak auth-register-rbac (TODO(BE)): hanya register, verify-email, dan resend-verification
// yang masih dilayani mock. Endpoint /auth/login, /auth/refresh, /auth/logout, dan /auth/me
// langsung diteruskan ke backend NestJS.
const ACTIVATION_ROUTES = ['POST /register', 'POST /verify-email', 'POST /resend-verification']

export const handleAuth: MockHandler = ({ url, method, body }) => {
  if (!url.pathname.startsWith(AUTH)) {
    return null
  }
  const route = `${method} ${url.pathname.slice(AUTH.length)}`
  if (!ACTIVATION_ROUTES.includes(route)) {
    return null
  }

  const fields = (body ?? {}) as Record<string, unknown>
  if (window.__nkMock === 'rate-limit') {
    return fail(429, 'Too Many Requests')
  }
  if (route === 'POST /register') {
    const name = typeof fields.name === 'string' ? fields.name.trim() : ''
    const email = typeof fields.email === 'string' ? fields.email.trim() : ''
    const password = typeof fields.password === 'string' ? fields.password : ''
    const bytes = new TextEncoder().encode(password).length
    if (!name || name.length > 100 || !EMAIL_PATTERN.test(email) || bytes < 8 || bytes > 72) {
      return fail(400, 'Invalid request body')
    }
    return accepted('Registration received. Please check your email to activate your account')
  }
  if (route === 'POST /resend-verification') {
    const email = typeof fields.email === 'string' ? fields.email.trim() : ''
    return EMAIL_PATTERN.test(email)
      ? accepted('If the account needs activation, an email has been sent')
      : fail(400, 'Invalid request body')
  }
  if (route === 'POST /verify-email') {
    const token = typeof fields.token === 'string' ? fields.token : ''
    if (
      window.__nkMock === 'token-expired' ||
      !TOKEN_PATTERN.test(token) ||
      token === MOCK_EXPIRED_TOKEN
    ) {
      return fail(400, 'Invalid or expired token')
    }
    return json(200, { code: 200, status: 'OK', message: 'Email verified', data: null })
  }
  return null
}
