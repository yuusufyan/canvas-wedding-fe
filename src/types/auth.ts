// Body for POST /auth/login.
export interface LoginRequest {
  email: string
  password: string
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

// `data` shape for GET /auth/me and user response.
export interface MeResponse {
  id: string
  name: string
  email: string
  role: RoleSummary
  is_active: boolean
  created_at: string
  updated_at: string
}
