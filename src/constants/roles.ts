export const ROLES = {
  SUPERADMIN: 'SuperAdmin',
  USER: 'User',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

// Role sistem tidak bisa diubah atau dihapus (backend: PATCH/DELETE 403).
export const SYSTEM_ROLE_NAMES: readonly string[] = [ROLES.SUPERADMIN, ROLES.USER]

export function isSystemRole(name: string): boolean {
  return SYSTEM_ROLE_NAMES.includes(name)
}
