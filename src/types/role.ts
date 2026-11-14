// `data` shape for GET/POST/PATCH /roles.
export interface Role {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreateRoleRequest {
  name: string
  description?: string | null
}

export interface UpdateRoleRequest {
  name?: string
  description?: string | null
}
