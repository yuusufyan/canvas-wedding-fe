import { ApiError } from '@/api/http'

// Pesan generik berbahasa Indonesia untuk kegagalan aksi; detail teknis tidak ditampilkan.
export function describeError(error: unknown, conflictMessage?: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Kamu tidak punya akses untuk tindakan ini.'
    }
    if (error.status === 404) {
      return 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.'
    }
    if (error.status === 409 && conflictMessage) {
      return conflictMessage
    }
    if (error.status === 0) {
      return 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'
    }
  }
  return 'Terjadi kendala. Coba lagi sebentar lagi.'
}
