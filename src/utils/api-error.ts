import { ApiError } from '@/api/http'

// Pesan BE yang dipakai untuk membedakan arti sebuah 409/403 (tidak pernah ditampilkan mentah).
const BE_EMAIL_TAKEN = 'Email already registered'
const BE_SELF_PROTECTED = 'You cannot deactivate, demote, or delete yourself'
const BE_LAST_SUPERADMIN = 'At least one active SuperAdmin must remain'
const BE_ROLE_NAME_TAKEN = 'Role name already exists'
const BE_ROLE_IN_USE = 'Role is still used by users'

const CONFLICT_TEXT: Record<string, string> = {
  [BE_EMAIL_TAKEN]: 'Email sudah terdaftar. Gunakan email lain.',
  [BE_SELF_PROTECTED]:
    'Tindakan ditolak: akunmu sendiri tidak bisa dinonaktifkan, diturunkan rolenya, atau dihapus.',
  [BE_LAST_SUPERADMIN]: 'Tindakan ditolak: harus tersisa minimal satu SuperAdmin aktif.',
  [BE_ROLE_NAME_TAKEN]: 'Nama role sudah dipakai. Gunakan nama lain.',
  [BE_ROLE_IN_USE]: 'Role masih dipakai pengguna.',
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
