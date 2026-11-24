import { computed } from 'vue'
import { SESSION_ROLES } from '@/constants/roles'
import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const authStore = useAuthStore()

  const isSuperAdmin = computed(() => authStore.profile?.role === SESSION_ROLES.SUPERADMIN)
  const canManageUsers = computed(() => isSuperAdmin.value)
  const canManageRoles = computed(() => isSuperAdmin.value)

  return { isSuperAdmin, canManageUsers, canManageRoles }
}
