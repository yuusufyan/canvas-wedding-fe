import type { RoleSummary } from './auth'

// `data` shape for GET/POST/PATCH /users.
export interface User {
  id: string
  name: string
  email: string
  role: RoleSummary
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  roleId: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  roleId?: string
  isActive?: boolean
}
