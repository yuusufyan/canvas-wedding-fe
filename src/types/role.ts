// `data` shape for GET/POST/PATCH /roles.
export interface Role {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description?: string | null
}

export interface UpdateRoleRequest {
  name?: string
  description?: string | null
}
