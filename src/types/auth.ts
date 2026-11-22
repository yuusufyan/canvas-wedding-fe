// Body for POST /auth/login.
export interface LoginRequest {
  email: string
  password: string
}

// Body untuk POST /auth/register (TODO(BE): kontrak auth-register-rbac, EP-01; respons 202 identik).
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

// Body untuk POST /auth/verify-email (EP-09) dan POST /auth/resend-verification (EP-10).
export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

// `data` shape shared by POST /auth/login and POST /auth/refresh.
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// `role` summary inside user / auth profile.
export interface RoleSummary {
  id: string
  name: string
}

// Item menu sidebar dari GET /auth/me (TODO(BE): draf kontrak auth-register-rbac, EP-02).
// Daftar datar; parent_key membentuk pohon satu tingkat.
export interface MenuItem {
  key: string
  label: string
  path: string
  icon?: string | null
  parent_key?: string | null
  sort_order: number
}

// `data` shape for GET /auth/me and user response. permissions dan menus ditambahkan
// backend (additive); opsional sampai endpoint-nya aktif.
export interface MeResponse {
  id: string
  name: string
  email: string
  role: RoleSummary
  is_active: boolean
  created_at: string
  updated_at: string
  permissions?: string[]
  menus?: MenuItem[]
}
