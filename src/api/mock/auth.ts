import { API_BASE_PATH } from '@/constants/api'
import type { MeResponse, MenuItem, TokenResponse } from '@/types/auth'
import { MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN, fail, json, ok, type MockHandler } from './http'

const AUTH = `${API_BASE_PATH}/auth`
const MOCK_EMAIL = 'admin@contoh.test'

function menu(key: string, label: string, path: string, icon: string, sortOrder: number): MenuItem {
  return { key, label, path, icon, parent_key: null, sort_order: sortOrder }
}

// Menu SuperAdmin mengikuti seed backend (auth-register-rbac, draf).
const ADMIN_MENUS: MenuItem[] = [
  menu('admin.dashboard', 'Dashboard', '/admin', 'grid', 10),
  menu('admin.templates', 'Template', '/admin/template', 'layout', 20),
  menu('admin.invitations', 'Undangan', '/admin/undangan', 'mail', 30),
  menu('admin.guests', 'Tamu', '/admin/tamu', 'users', 40),
  menu('admin.users', 'Pengguna & Role', '/admin/pengguna', 'user-cog', 50),
  menu('admin.membership', 'Membership', '/admin/membership', 'credit-card', 60),
  menu('admin.settings', 'Pengaturan', '/admin/pengaturan', 'settings', 90),
]

const ME: MeResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Admin Utama',
  email: MOCK_EMAIL,
  role: { id: '00000000-0000-4000-8000-0000000000a1', name: 'SuperAdmin' },
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  permissions: [],
  menus: ADMIN_MENUS,
}

const TOKENS: TokenResponse = {
  access_token: MOCK_ACCESS_TOKEN,
  refresh_token: MOCK_REFRESH_TOKEN,
  token_type: 'Bearer',
  expires_in: 900,
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
    return fields.email === MOCK_EMAIL && typeof fields.password === 'string' && fields.password
      ? ok(TOKENS)
      : fail(401, 'Unauthorized')
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
