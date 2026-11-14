import type { PaginatedResult, PaginationParams } from '@/types/api'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/types/user'
import { apiRequest, apiRequestPaginated } from './http'

function buildQuery(params?: PaginationParams): string {
  const page = Math.max(1, params?.page ?? 1)
  const limit = Math.min(100, Math.max(1, params?.limit ?? 10))
  return `?page=${page}&limit=${limit}`
}

export function listUsers(params?: PaginationParams): Promise<PaginatedResult<User>> {
  return apiRequestPaginated<User>(`/users${buildQuery(params)}`, {
    method: 'GET',
  })
}

export function getUser(id: string): Promise<User> {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

export function createUser(body: CreateUserRequest): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body,
  })
}

export function updateUser(id: string, body: UpdateUserRequest): Promise<User> {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteUser(id: string): Promise<null> {
  return apiRequest<null>(`/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
