export const ROLES = {
  SUPERADMIN: 'superadmin',
  USER: 'user',
} as const

export const PERMISSIONS = {
  USERS_MANAGE: 'users.manage',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]
export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role sistem tidak bisa diubah atau dihapus (backend: PATCH/DELETE 403).
export const SYSTEM_ROLE_NAMES: readonly string[] = [ROLES.SUPERADMIN, ROLES.USER]

export function isSystemRole(name: string): boolean {
  return SYSTEM_ROLE_NAMES.includes(name)
}
