// Satu-satunya tempat yang membaca import.meta.env. Pemuat mock dibentuk di sini dengan
// kondisi DEV di dalam ekspresi yang sama agar bundler membuang impor dinamis
// src/api/mock dari bundle produksi.
// URL dasar backend NestJS, dipanggil langsung dari browser (CORS diatur di backend lewat
// CORS_ORIGIN). Tanpa env: dev memakai http://localhost:3000; build produksi memakai string
// kosong (URL relatif, same-origin), jadi produksi sebaiknya mengisi VITE_API_BASE_URL.
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:3000'
export const apiBaseUrl: string = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : '')
).replace(/\/+$/, '')

export const loadMockApi: (() => Promise<typeof import('./api/mock')>) | null =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === 'true'
    ? () => import('./api/mock')
    : null
