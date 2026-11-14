import type { PaginatedResult, PaginationParams } from '@/types/api'
import type { CreateRoleRequest, Role, UpdateRoleRequest } from '@/types/role'
import { apiRequest, apiRequestPaginated } from './http'

function buildQuery(params?: PaginationParams): string {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.min(100, Math.max(1, params?.limit ?? 10))
  return `?page=${page}&limit=${limit}`
}

export function listRoles(params?: PaginationParams): Promise<PaginatedResult<Role>> {
  return apiRequestPaginated<Role>(`/roles${buildQuery(params)}`, {
    method: 'GET',
  })
}

export function getRole(id: string): Promise<Role> {
  return apiRequest<Role>(`/roles/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

export function createRole(body: CreateRoleRequest): Promise<Role> {
  return apiRequest<Role>('/roles', {
    method: 'POST',
    body,
  })
}

export function updateRole(id: string, body: UpdateRoleRequest): Promise<Role> {
  return apiRequest<Role>(`/roles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteRole(id: string): Promise<null> {
  return apiRequest<null>(`/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
