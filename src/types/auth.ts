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

// Body respons POST /auth/login dan POST /auth/refresh di backend NestJS (isi `data` pada envelope),
// field camelCase (`expiresIn` = umur access token dalam detik).
export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

// Identitas user dari backend NestJS (login dan GET /auth/me). `role` adalah nama role
// (string huruf kecil, mis. 'superadmin'), bukan objek.
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

// Body respons POST /auth/login.
export interface LoginResponse extends TokenResponse {
  user: AuthUser
}

// Body untuk POST /auth/refresh dan POST /auth/logout.
export interface RefreshTokenRequest {
  refreshToken: string
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

// Body respons GET /auth/me di backend NestJS (isi `data` pada envelope). `permissions` dan `menus`
// belum dikirim backend NestJS (TODO(BE)); opsional sampai ada, sidebar memakai menu cadangan.
export interface MeResponse extends AuthUser {
  permissions?: string[]
  menus?: MenuItem[]
}
