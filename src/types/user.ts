import type { RoleSummary } from './auth'

// `data` shape for GET/POST/PATCH /users.
export interface User {
  id: string
  name: string
  email: string
  role: RoleSummary
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role_id: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
  role_id?: string
  is_active?: boolean
}
