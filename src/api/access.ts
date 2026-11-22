import type { PaginatedResult } from '@/types/api'
import type { CatalogMenu, Permission, RoleMenus, RolePermissions } from '@/types/access'
import { apiRequest, apiRequestPaginated } from './http'
import { buildQuery } from './query'

// Katalog dan pemetaan izin/menu per role (backend branch feat/auth-rbac). Hanya SuperAdmin.
const CATALOG_LIMIT = 100

export function listPermissions(): Promise<PaginatedResult<Permission>> {
  return apiRequestPaginated<Permission>(
    `/permissions${buildQuery({ page: 1, limit: CATALOG_LIMIT })}`,
    {
      method: 'GET',
    },
  )
}

export function listCatalogMenus(): Promise<PaginatedResult<CatalogMenu>> {
  return apiRequestPaginated<CatalogMenu>(
    `/menus${buildQuery({ page: 1, limit: CATALOG_LIMIT })}`,
    {
      method: 'GET',
    },
  )
}

export function getRolePermissions(roleId: string): Promise<RolePermissions> {
  return apiRequest<RolePermissions>(`/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'GET',
  })
}

// Mengganti seluruh set permission role (bukan menambah).
export function setRolePermissions(
  roleId: string,
  permissions: string[],
): Promise<RolePermissions> {
  return apiRequest<RolePermissions>(`/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'PUT',
    body: { permissions },
  })
}

export function getRoleMenus(roleId: string): Promise<RoleMenus> {
  return apiRequest<RoleMenus>(`/roles/${encodeURIComponent(roleId)}/menus`, { method: 'GET' })
}

export function setRoleMenus(roleId: string, menus: string[]): Promise<RoleMenus> {
  return apiRequest<RoleMenus>(`/roles/${encodeURIComponent(roleId)}/menus`, {
    method: 'PUT',
    body: { menus },
  })
}
