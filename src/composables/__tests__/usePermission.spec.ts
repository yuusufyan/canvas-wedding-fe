import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ROLES } from '@/constants/roles'
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
        role: { id: 'r1', name: 'Staff' },
        is_active: true,
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
        role: { id: 'r2', name: ROLES.SUPERADMIN },
        is_active: true,
      },
    })
    const { isSuperAdmin, canManageUsers, canManageRoles } = usePermission()
    expect(isSuperAdmin.value).toBe(true)
    expect(canManageUsers.value).toBe(true)
    expect(canManageRoles.value).toBe(true)
  })
})
