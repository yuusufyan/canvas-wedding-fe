import { ApiError } from '@/api/http'

// Pesan BE yang dipakai untuk membedakan arti sebuah 409 (tidak pernah ditampilkan mentah).
const EMAIL_TAKEN_TEXT = 'Email sudah terdaftar. Gunakan email lain.'
const SELF_PROTECTED_TEXT =
  'Tindakan ditolak: akunmu sendiri tidak bisa dinonaktifkan, diturunkan rolenya, atau dihapus.'
const LAST_SUPERADMIN_TEXT = 'Tindakan ditolak: harus tersisa minimal satu SuperAdmin aktif.'
const ROLE_NAME_TAKEN_TEXT = 'Nama role sudah dipakai. Gunakan nama lain.'
const ROLE_IN_USE_TEXT = 'Role masih dipakai pengguna.'

const CONFLICT_TEXT: Record<string, string> = {
  // Pesan backend NestJS
  'Email sudah terdaftar': EMAIL_TAKEN_TEXT,
  'Tidak dapat menonaktifkan akun sendiri': SELF_PROTECTED_TEXT,
  'Tidak dapat menghapus akun sendiri': SELF_PROTECTED_TEXT,
  'Superadmin aktif terakhir tidak dapat dinonaktifkan atau dipindah role': LAST_SUPERADMIN_TEXT,
  'Superadmin aktif terakhir tidak dapat dihapus': LAST_SUPERADMIN_TEXT,
  'Nama role sudah digunakan': ROLE_NAME_TAKEN_TEXT,
  'Role masih digunakan oleh pengguna': ROLE_IN_USE_TEXT,
  // Kompatibilitas pesan lama
  'Email already registered': EMAIL_TAKEN_TEXT,
  'You cannot deactivate, demote, or delete yourself': SELF_PROTECTED_TEXT,
  'At least one active SuperAdmin must remain': LAST_SUPERADMIN_TEXT,
  'Role name already exists': ROLE_NAME_TAKEN_TEXT,
  'Role is still used by users': ROLE_IN_USE_TEXT,
}

// Pesan generik berbahasa Indonesia untuk kegagalan aksi; detail teknis tidak ditampilkan.
// `conflictMessage` dipakai bila 409 tidak membawa pesan BE yang dikenal.
export function describeError(error: unknown, conflictMessage?: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Kamu tidak punya akses untuk tindakan ini.'
    }
    if (error.status === 404) {
      return 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.'
    }
    if (error.status === 409) {
      const known = error.serverMessage ? CONFLICT_TEXT[error.serverMessage] : undefined
      if (known) {
        return known
      }
      if (conflictMessage) {
        return conflictMessage
      }
    }
    if (error.status === 0) {
      return 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'
    }
  }
  return 'Terjadi kendala. Coba lagi sebentar lagi.'
}
