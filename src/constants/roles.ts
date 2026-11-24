export const ROLES = {
  SUPERADMIN: 'SuperAdmin',
  USER: 'User',
} as const

// Nama role di sesi login (`role` pada POST /auth/login dan GET /auth/me di backend NestJS):
// string huruf kecil, beda dari `ROLES` yang dipakai API role/pengguna (TODO(BE), mock).
export const SESSION_ROLES = {
  SUPERADMIN: 'superadmin',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

// Role sistem tidak bisa diubah atau dihapus (backend: PATCH/DELETE 403).
export const SYSTEM_ROLE_NAMES: readonly string[] = [ROLES.SUPERADMIN, ROLES.USER]

export function isSystemRole(name: string): boolean {
  return SYSTEM_ROLE_NAMES.includes(name)
}
