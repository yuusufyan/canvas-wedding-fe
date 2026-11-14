export const ROLES = {
  SUPERADMIN: 'SuperAdmin',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]
