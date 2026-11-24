import { API_BASE_PATH } from '@/constants/api'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'
import {
  ADMIN_MENUS,
  APP_MENUS,
  MOCK_EMAIL,
  MOCK_ME_ID,
  MOCK_PERMISSIONS,
  MOCK_SUPERADMIN_ROLE_ID,
} from './auth'
import { fail, guard, ok, paginate, type MockHandler, type MockRequest } from './http'

// Data contoh (fiktif) untuk pengguna, role, izin, dan menu. Aturan mengikuti backend feat/auth-rbac:
// role SuperAdmin dan User bersifat sistem (PATCH/DELETE 403), akun sendiri dan SuperAdmin aktif terakhir
// terlindungi (409), role yang dipakai tidak bisa dihapus (409), dan PUT mengganti seluruh set.
const DAY = 24 * 60 * 60 * 1000
const USER_ROLE_ID = '00000000-0000-4000-8000-0000000000a2'
const OPERATOR_ROLE_ID = '00000000-0000-4000-8000-0000000000a3'
const FINANCE_ROLE_ID = '00000000-0000-4000-8000-0000000000a4'

function at(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY).toISOString()
}

function role(id: string, name: string, description: string, daysAgo: number): Role {
  return { id, name, description, createdAt: at(daysAgo), updatedAt: at(daysAgo) }
}

let roles: Role[] = [
  role(MOCK_SUPERADMIN_ROLE_ID, 'superadmin', 'Akses penuh ke seluruh sistem.', 120),
  role(USER_ROLE_ID, 'user', 'Pelanggan: undangan, budget, tamu.', 120),
  role(OPERATOR_ROLE_ID, 'Operator', 'Mengelola template dan undangan.', 40),
  role(FINANCE_ROLE_ID, 'Keuangan', 'Memantau membership dan budget.', 30),
]

const CATALOG_MENUS = [...ADMIN_MENUS, ...APP_MENUS]

const rolePermissions = new Map<string, string[]>([
  [MOCK_SUPERADMIN_ROLE_ID, []],
  [
    USER_ROLE_ID,
    [
      'templates.read',
      'invitations.read',
      'invitations.write',
      'guests.read',
      'guests.write',
      'budget.read',
      'budget.write',
      'membership.read',
    ],
  ],
  [OPERATOR_ROLE_ID, ['templates.read', 'templates.write', 'invitations.read', 'guests.read']],
  [FINANCE_ROLE_ID, ['budget.read', 'membership.read', 'membership.write']],
])

const roleMenus = new Map<string, string[]>([
  [MOCK_SUPERADMIN_ROLE_ID, ADMIN_MENUS.map((m) => m.key)],
  [USER_ROLE_ID, APP_MENUS.map((m) => m.key)],
  [
    OPERATOR_ROLE_ID,
    ['admin.dashboard', 'admin.templates', 'admin.invitations', 'admin.guests', 'admin.settings'],
  ],
  [FINANCE_ROLE_ID, ['admin.dashboard', 'admin.membership', 'admin.settings']],
])

function summary(roleId: string): User['role'] {
  const found = roles.find((r) => r.id === roleId)!
  return { id: found.id, name: found.name }
}

function user(
  n: number,
  name: string,
  email: string,
  roleId: string,
  active: boolean,
  daysAgo: number,
): User {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    name,
    email,
    role: summary(roleId),
    isActive: active,
    createdAt: at(daysAgo),
    updatedAt: at(daysAgo),
  }
}

let users: User[] = [
  user(1, 'Admin Utama', MOCK_EMAIL, MOCK_SUPERADMIN_ROLE_ID, true, 100),
  user(2, 'Rina Operator', 'rina@contoh.test', OPERATOR_ROLE_ID, true, 60),
  user(3, 'Budi Keuangan', 'budi@contoh.test', FINANCE_ROLE_ID, true, 55),
  user(4, 'Nadia Pratama', 'nadia@contoh.test', USER_ROLE_ID, true, 40),
  user(5, 'Citra Lestari', 'citra@contoh.test', USER_ROLE_ID, true, 35),
  user(6, 'Dimas Anggara', 'dimas@contoh.test', USER_ROLE_ID, false, 30),
  user(7, 'Gita Maharani', 'gita@contoh.test', USER_ROLE_ID, true, 20),
  user(8, 'Andi Operator', 'andi@contoh.test', OPERATOR_ROLE_ID, true, 18),
  user(9, 'Sari Operator', 'sari@contoh.test', OPERATOR_ROLE_ID, true, 15),
  user(10, 'Hana Kusuma', 'hana@contoh.test', USER_ROLE_ID, true, 9),
  user(11, 'Indra Saputra', 'indra@contoh.test', USER_ROLE_ID, true, 5),
  user(12, 'Jihan Permata', 'jihan@contoh.test', USER_ROLE_ID, true, 2),
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function activeSuperAdmins(): User[] {
  return users.filter((u) => u.role.id === MOCK_SUPERADMIN_ROLE_ID && u.isActive)
}

function isLastSuperAdmin(target: User): boolean {
  const admins = activeSuperAdmins()
  return admins.length === 1 && admins[0]!.id === target.id
}

function validPassword(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  const bytes = new TextEncoder().encode(value).length
  return bytes >= 8 && bytes <= 72
}

const USERS = `${API_BASE_PATH}/users`
const ROLES = `${API_BASE_PATH}/roles`

function handleUsers({ url, method, body }: MockRequest): Response | null {
  const rest = url.pathname.slice(USERS.length).replace(/^\//, '')
  const fields = (body ?? {}) as Record<string, unknown>

  if (rest === '' && method === 'GET') {
    return paginate(window.__nkMock === 'empty' ? [] : users, url, 10)
  }
  if (rest === '' && method === 'POST') {
    const name = typeof fields.name === 'string' ? fields.name.trim() : ''
    const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''
    const roleId = typeof fields.roleId === 'string' ? fields.roleId : ''
    if (
      !name ||
      name.length > 100 ||
      !EMAIL_PATTERN.test(email) ||
      !validPassword(fields.password)
    ) {
      return fail(400, 'Invalid request body')
    }
    if (!roles.some((r) => r.id === roleId)) {
      return fail(400, 'Role not found')
    }
    if (users.some((u) => u.email === email)) {
      return fail(409, 'Email already registered')
    }
    const created = user(Date.now() % 1e9, name, email, roleId, true, 0)
    users = [...users, created]
    return json201(created)
  }

  const target = users.find((u) => u.id === rest)
  if (!UUID_PATTERN.test(rest)) {
    return fail(400, 'Invalid ID')
  }
  if (!target) {
    return fail(404, 'User not found')
  }
  if (method === 'GET') {
    return ok(target)
  }
  if (method === 'PATCH') {
    return patchUser(target, fields)
  }
  if (method === 'DELETE') {
    if (target.id === MOCK_ME_ID || isLastSuperAdmin(target)) {
      return fail(409, protectedAccountMessage(target))
    }
    users = users.filter((u) => u.id !== target.id)
    return new Response(null, { status: 204 })
  }
  return null
}

// Pesan sama dengan backend: role sistem tidak bisa diubah/dihapus; 409 pengguna dibedakan diri sendiri vs SuperAdmin terakhir.
function protectedRoleMessage(target: Role): string {
  return target.id === MOCK_SUPERADMIN_ROLE_ID
    ? 'Role SuperAdmin cannot be modified or deleted'
    : 'Role User cannot be modified or deleted'
}

function protectedAccountMessage(target: User): string {
  return target.id === MOCK_ME_ID
    ? 'You cannot deactivate, demote, or delete yourself'
    : 'At least one active SuperAdmin must remain'
}

function json201(data: unknown): Response {
  return new Response(JSON.stringify({ code: 201, status: 'Created', message: 'Created', data }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}

function patchUser(target: User, fields: Record<string, unknown>): Response {
  const keys = Object.keys(fields)
  if (
    keys.length === 0 ||
    keys.some((k) => !['name', 'email', 'password', 'roleId', 'isActive'].includes(k))
  ) {
    return fail(400, 'Invalid request body')
  }
  if ('password' in fields && !validPassword(fields.password)) {
    return fail(400, 'Invalid request body')
  }
  if ('roleId' in fields && !roles.some((r) => r.id === fields.roleId)) {
    return fail(400, 'Role not found')
  }
  const demotes = 'roleId' in fields && fields.roleId !== target.role.id
  const deactivates = fields.isActive === false && target.isActive
  if ((demotes || deactivates) && (target.id === MOCK_ME_ID || isLastSuperAdmin(target))) {
    return fail(409, protectedAccountMessage(target))
  }
  if (typeof fields.email === 'string') {
    const email = fields.email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      return fail(400, 'Invalid request body')
    }
    if (users.some((u) => u.email === email && u.id !== target.id)) {
      return fail(409, 'Email already registered')
    }
    target.email = email
  }
  if (typeof fields.name === 'string' && fields.name.trim()) {
    target.name = fields.name.trim()
  }
  if (typeof fields.roleId === 'string') {
    target.role = summary(fields.roleId)
  }
  if (typeof fields.isActive === 'boolean') {
    target.isActive = fields.isActive
  }
  target.updatedAt = new Date().toISOString()
  return ok(target)
}

function handleRoles({ url, method, body }: MockRequest): Response | null {
  const rest = url.pathname.slice(ROLES.length).replace(/^\//, '')
  const fields = (body ?? {}) as Record<string, unknown>

  if (rest === '' && method === 'GET') {
    return paginate(roles, url, 10)
  }
  if (rest === '' && method === 'POST') {
    const name = typeof fields.name === 'string' ? fields.name.trim() : ''
    if (name.length < 3 || name.length > 50 || !ROLE_NAME_PATTERN.test(name)) {
      return fail(400, 'Invalid request body')
    }
    if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      return fail(409, 'Role name already exists')
    }
    const description =
      typeof fields.description === 'string' && fields.description ? fields.description : null
    const created: Role = {
      ...role(
        `00000000-0000-4000-8000-${String(Date.now() % 1e12).padStart(12, '0')}`,
        name,
        '',
        0,
      ),
      description,
    }
    roles = [...roles, created]
    rolePermissions.set(created.id, [])
    roleMenus.set(created.id, [])
    return json201(created)
  }

  const [id = '', sub] = rest.split('/')
  if (!UUID_PATTERN.test(id)) {
    return fail(400, 'Invalid ID')
  }
  const target = roles.find((r) => r.id === id)
  if (!target) {
    return fail(404, 'Role not found')
  }
  if (sub === 'permissions' || sub === 'menus') {
    return handleRoleAccess(target, sub, method, fields)
  }
  if (sub) {
    return null
  }
  if (method === 'GET') {
    return ok(target)
  }
  if (method === 'PATCH') {
    if (target.id === MOCK_SUPERADMIN_ROLE_ID || target.id === USER_ROLE_ID) {
      return fail(403, protectedRoleMessage(target))
    }
    if (Object.keys(fields).length === 0) {
      return fail(400, 'At least one field must be provided')
    }
    if (typeof fields.name === 'string') {
      const name = fields.name.trim()
      if (name.length < 3 || name.length > 50 || !ROLE_NAME_PATTERN.test(name)) {
        return fail(400, 'Invalid request body')
      }
      if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== target.id)) {
        return fail(409, 'Role name already exists')
      }
      target.name = name
    }
    if (typeof fields.description === 'string') {
      target.description = fields.description || null
    }
    target.updatedAt = new Date().toISOString()
    return ok(target)
  }
  if (method === 'DELETE') {
    if (target.id === MOCK_SUPERADMIN_ROLE_ID || target.id === USER_ROLE_ID) {
      return fail(403, protectedRoleMessage(target))
    }
    if (users.some((u) => u.role.id === target.id)) {
      return fail(409, 'Role is still used by users')
    }
    roles = roles.filter((r) => r.id !== target.id)
    return new Response(null, { status: 204 })
  }
  return null
}

function handleRoleAccess(
  target: Role,
  kind: 'permissions' | 'menus',
  method: string,
  fields: Record<string, unknown>,
): Response | null {
  const store = kind === 'permissions' ? rolePermissions : roleMenus
  const catalog =
    kind === 'permissions' ? MOCK_PERMISSIONS.map((p) => p.code) : CATALOG_MENUS.map((m) => m.key)
  if (method === 'GET') {
    return ok({ roleId: target.id, [kind]: store.get(target.id) ?? [] })
  }
  if (method !== 'PUT') {
    return null
  }
  const next = fields[kind]
  if (
    !Array.isArray(next) ||
    next.some((v) => typeof v !== 'string') ||
    new Set(next).size !== next.length
  ) {
    return fail(400, 'Invalid request body')
  }
  if (target.id === MOCK_SUPERADMIN_ROLE_ID) {
    return fail(403, protectedRoleMessage(target))
  }
  if (next.some((v) => !catalog.includes(v as string))) {
    return fail(400, kind === 'permissions' ? 'Unknown permission code' : 'Unknown menu key')
  }
  store.set(target.id, next as string[])
  return ok({ roleId: target.id, [kind]: next })
}

export const handleAccounts: MockHandler = (request) => {
  const { pathname } = request.url
  const inScope = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
  const isUsers = inScope(USERS)
  const isRoles = inScope(ROLES)
  const isCatalog = inScope(`${API_BASE_PATH}/permissions`) || inScope(`${API_BASE_PATH}/menus`)
  if (!isUsers && !isRoles && !isCatalog) {
    return null
  }
  const blocked = guard(request)
  if (blocked) {
    return blocked
  }
  if (isUsers) {
    return handleUsers(request)
  }
  if (isRoles) {
    return handleRoles(request)
  }
  if (request.method !== 'GET') {
    return null
  }
  return pathname.endsWith('/permissions')
    ? paginate(MOCK_PERMISSIONS, request.url, 10)
    : paginate(CATALOG_MENUS, request.url, 10)
}
