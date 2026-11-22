import type { MenuItem } from './auth'

// Bentuk mengikuti kode backend branch feat/auth-rbac (belum di main): katalog permission dan menu
// serta set permission/menu per role. PUT mengganti seluruh set.
export interface Permission {
  code: string
  description: string
}

export type CatalogMenu = MenuItem

export interface RolePermissions {
  role_id: string
  permissions: string[]
}

export interface RoleMenus {
  role_id: string
  menus: string[]
}
