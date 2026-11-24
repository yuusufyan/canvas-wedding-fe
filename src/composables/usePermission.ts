import { computed } from 'vue'
import { PERMISSIONS } from '@/constants/roles'
import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const authStore = useAuthStore()

  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const hasPermission = (code: string) => authStore.hasPermission(code)
  const canManageUsers = computed(() => authStore.hasPermission(PERMISSIONS.USERS_MANAGE))
  const canManageRoles = computed(() => authStore.hasPermission(PERMISSIONS.USERS_MANAGE))

  return { isSuperAdmin, hasPermission, canManageUsers, canManageRoles }
}
