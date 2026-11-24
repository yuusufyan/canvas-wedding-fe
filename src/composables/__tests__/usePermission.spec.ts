import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SESSION_ROLES } from '@/constants/roles'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '../usePermission'

describe('usePermission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns false when profile is null or role is not SuperAdmin', () => {
    const { isSuperAdmin, canManageUsers, canManageRoles } = usePermission()
    expect(isSuperAdmin.value).toBe(false)
    expect(canManageUsers.value).toBe(false)
    expect(canManageRoles.value).toBe(false)

    const store = useAuthStore()
    store.$patch({
      isAuthenticated: true,
      profile: {
        id: 'u1',
        name: 'Staff Member',
        email: 'staff@example.com',
        role: 'staff',
      },
    })
    expect(isSuperAdmin.value).toBe(false)
    expect(canManageUsers.value).toBe(false)
    expect(canManageRoles.value).toBe(false)
  })

  it('returns true when role is SuperAdmin', () => {
    const store = useAuthStore()
    store.$patch({
      isAuthenticated: true,
      profile: {
        id: 'u2',
        name: 'Super Admin',
        email: 'superadmin@example.com',
        role: SESSION_ROLES.SUPERADMIN,
      },
    })
    const { isSuperAdmin, canManageUsers, canManageRoles } = usePermission()
    expect(isSuperAdmin.value).toBe(true)
    expect(canManageUsers.value).toBe(true)
    expect(canManageRoles.value).toBe(true)
  })
})
