import { API_BASE_PATH } from '@/constants/api'
import type { MeResponse, MenuItem, TokenResponse } from '@/types/auth'
import { MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN, fail, json, ok, type MockHandler } from './http'

const AUTH = `${API_BASE_PATH}/auth`
export const MOCK_EMAIL = 'admin@contoh.test'
export const MOCK_ME_ID = '00000000-0000-4000-8000-000000000001'
export const MOCK_SUPERADMIN_ROLE_ID = '00000000-0000-4000-8000-0000000000a1'

export const MOCK_PERMISSIONS = [
  ['templates.read', 'Melihat template'],
  ['templates.write', 'Membuat, mengubah, dan mengarsipkan template'],
  ['invitations.read', 'Melihat undangan'],
  ['invitations.write', 'Membuat dan mengubah undangan'],
  ['guests.read', 'Melihat tamu, RSVP, dan ucapan'],
  ['guests.write', 'Mengelola tamu dan mengirim undangan'],
  ['budget.read', 'Melihat budget'],
  ['budget.write', 'Mengelola budget'],
  ['membership.read', 'Melihat status membership'],
  ['membership.write', 'Mengelola membership'],
].map(([code, description]) => ({ code: code!, description: description! }))

function menu(key: string, label: string, path: string, icon: string, sortOrder: number): MenuItem {
  return { key, label, path, icon, parent_key: null, sort_order: sortOrder }
}

// Menu SuperAdmin mengikuti seed backend (auth-register-rbac, draf).
export const ADMIN_MENUS: MenuItem[] = [
  menu('admin.dashboard', 'Dashboard', '/admin', 'grid', 10),
  menu('admin.templates', 'Template', '/admin/template', 'layout', 20),
  menu('admin.invitations', 'Undangan', '/admin/undangan', 'mail', 30),
  menu('admin.guests', 'Tamu', '/admin/tamu', 'users', 40),
  menu('admin.users', 'Pengguna & Role', '/admin/pengguna', 'user-cog', 50),
  menu('admin.membership', 'Membership', '/admin/membership', 'credit-card', 60),
  menu('admin.settings', 'Pengaturan', '/admin/pengaturan', 'settings', 90),
]

// Menu area pelanggan (seed backend), dipakai katalog /menus dan pengaturan role.
export const APP_MENUS: MenuItem[] = [
  menu('app.home', 'Beranda', '/app', 'home', 10),
  menu('app.invitations', 'Undanganku', '/app/undangan', 'mail', 20),
  menu('app.budget', 'Budget', '/app/budget', 'wallet', 30),
  menu('app.guests', 'Tamu & RSVP', '/app/tamu', 'users', 40),
  menu('app.templates', 'Template', '/app/template', 'layout', 50),
  menu('app.settings', 'Pengaturan', '/app/pengaturan', 'settings', 90),
]

const ME: MeResponse = {
  id: MOCK_ME_ID,
  name: 'Admin Utama',
  email: MOCK_EMAIL,
  role: { id: MOCK_SUPERADMIN_ROLE_ID, name: 'SuperAdmin' },
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  permissions: MOCK_PERMISSIONS.map((p) => p.code),
  menus: [...ADMIN_MENUS, ...APP_MENUS],
}

const TOKENS: TokenResponse = {
  access_token: MOCK_ACCESS_TOKEN,
  refresh_token: MOCK_REFRESH_TOKEN,
  token_type: 'Bearer',
  expires_in: 900,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
// Token berformat benar tetapi dianggap sudah kedaluwarsa/terpakai oleh mock.
export const MOCK_EXPIRED_TOKEN = 'x'.repeat(43)

function accepted(message: string): Response {
  return json(202, { code: 202, status: 'Accepted', message, data: null })
}

// Draf kontrak auth-register-rbac (TODO(BE)): register, verify-email, dan resend-verification.
// Jawaban register dan resend identik untuk email baru maupun yang sudah terdaftar.
const ACTIVATION_ROUTES = ['POST /register', 'POST /verify-email', 'POST /resend-verification']

function handleActivation(route: string, fields: Record<string, unknown>): Response | null {
  if (!ACTIVATION_ROUTES.includes(route)) {
    return null
  }
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

// Auth tiruan agar halaman terautentikasi bisa dicoba tanpa backend. Login menerima
// admin@contoh.test dengan kata sandi apa pun yang tidak kosong.
export const handleAuth: MockHandler = ({ url, method, headers, body }) => {
  if (!url.pathname.startsWith(AUTH)) {
    return null
  }
  const route = `${method} ${url.pathname.slice(AUTH.length)}`
  const fields = (body ?? {}) as Record<string, unknown>

  if (route === 'POST /login') {
    if (window.__nkMock === 'rate-limit') {
      return fail(429, 'Too Many Requests')
    }
    const valid =
      fields.email === MOCK_EMAIL && typeof fields.password === 'string' && fields.password
    if (!valid) {
      return fail(401, 'Unauthorized')
    }
    return window.__nkMock === 'unverified' ? fail(403, 'Email not verified') : ok(TOKENS)
  }
  const activation = handleActivation(route, fields)
  if (activation) {
    return activation
  }
  if (route === 'POST /refresh') {
    return fields.refresh_token === MOCK_REFRESH_TOKEN ? ok(TOKENS) : fail(401, 'Unauthorized')
  }
  if (route === 'POST /logout') {
    return new Response(null, { status: 204 })
  }
  if (route === 'GET /me') {
    return headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
      ? ok(ME)
      : json(401, { code: 401, status: 'error', message: 'Unauthorized' })
  }
  return null
}
