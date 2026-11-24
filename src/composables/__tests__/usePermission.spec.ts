import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { PERMISSIONS, ROLES } from '@/constants/roles'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '../usePermission'

describe('usePermission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns false when profile is null or role lacks permission', () => {
    const { isSuperAdmin, canManageUsers, canManageRoles, hasPermission } = usePermission()
    expect(isSuperAdmin.value).toBe(false)
    expect(canManageUsers.value).toBe(false)
    expect(canManageRoles.value).toBe(false)
    expect(hasPermission(PERMISSIONS.USERS_MANAGE)).toBe(false)

    const store = useAuthStore()
    store.$patch({
      isAuthenticated: true,
      profile: {
        id: 'u1',
        name: 'Staff Member',
        email: 'staff@example.com',
        role: 'staff',
      },
      permissions: ['templates.read'],
    })
    expect(isSuperAdmin.value).toBe(false)
    expect(canManageUsers.value).toBe(false)
    expect(canManageRoles.value).toBe(false)
    expect(hasPermission('templates.read')).toBe(true)
  })

  it('returns true for user management when non-superadmin holds users.manage permission', () => {
    const store = useAuthStore()
    store.$patch({
      isAuthenticated: true,
      profile: {
        id: 'u3',
        name: 'User Manager',
        email: 'manager@example.com',
        role: 'operator',
      },
      permissions: [PERMISSIONS.USERS_MANAGE],
    })
    const { isSuperAdmin, canManageUsers, canManageRoles } = usePermission()
    expect(isSuperAdmin.value).toBe(false)
    expect(canManageUsers.value).toBe(true)
    expect(canManageRoles.value).toBe(true)
  })

  it('returns true when role is superadmin', () => {
    const store = useAuthStore()
    store.$patch({
      isAuthenticated: true,
      profile: {
        id: 'u2',
        name: 'Super Admin',
        email: 'superadmin@example.com',
        role: ROLES.SUPERADMIN,
      },
    })
    const { isSuperAdmin, canManageUsers, canManageRoles } = usePermission()
    expect(isSuperAdmin.value).toBe(true)
    expect(canManageUsers.value).toBe(true)
    expect(canManageRoles.value).toBe(true)
  })
})
