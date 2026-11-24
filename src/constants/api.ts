import { apiBaseUrl } from '@/config'

// URL dasar backend (dari VITE_API_BASE_URL, lihat src/config.ts). Semua endpoint dipanggil
// langsung ke sini; backend NestJS tidak punya prefix `/api/v1`.
export const API_BASE_URL = apiBaseUrl

const parsed = new URL(API_BASE_URL || '/', window.location.origin)

// Origin dan path dasar hasil urai, dipakai mock untuk mengenali permintaan ke backend.
export const API_ORIGIN = parsed.origin
export const API_BASE_PATH = parsed.pathname.replace(/\/+$/, '')
