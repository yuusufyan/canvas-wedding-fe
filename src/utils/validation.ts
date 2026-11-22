import { PASSWORD_MAX_BYTES, PASSWORD_MIN_BYTES, passwordBytes } from './password'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX = 254
const NAME_MAX = 100

// Setiap validator mengembalikan pesan galat, atau '' bila valid. Aturan mengikuti validator backend.
export function validateEmail(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Email wajib diisi.'
  }
  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > EMAIL_MAX) {
    return 'Format email tidak valid.'
  }
  return ''
}

export function validateName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Nama lengkap wajib diisi.'
  }
  if (trimmed.length > NAME_MAX) {
    return `Nama lengkap maksimal ${NAME_MAX} karakter.`
  }
  return ''
}

export function validateNewPassword(value: string): string {
  if (!value) {
    return 'Kata sandi wajib diisi.'
  }
  const bytes = passwordBytes(value)
  if (bytes < PASSWORD_MIN_BYTES) {
    return `Kata sandi minimal ${PASSWORD_MIN_BYTES} karakter.`
  }
  if (bytes > PASSWORD_MAX_BYTES) {
    return `Kata sandi terlalu panjang (maksimal ${PASSWORD_MAX_BYTES} byte).`
  }
  return ''
}
