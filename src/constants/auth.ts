import type { InvitationPage } from '@/types/invitation-document'

// Lama berlaku tautan aktivasi (backend: 24 jam) dan jeda kirim ulang di UI.
export const ACTIVATION_TTL_TEXT = '24 jam'
export const RESEND_COOLDOWN_SECONDS = 60

// Batas percobaan login di backend: gagal per email dalam jendela 15 menit.
export const LOGIN_RATE_LIMIT_TEXT = 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'

// Pratinjau ponsel di panel brand halaman auth (konten pemasaran statis).
export const AUTH_PREVIEW_PAGE: InvitationPage = {
  id: 'auth-cover',
  title: 'Cover',
  background: '#2F3A30',
  elements: [
    {
      id: 'eyebrow',
      type: 'text',
      text: 'The wedding of',
      x: 30,
      y: 230,
      width: 300,
      height: 16,
      font: 'sans',
      size: 9,
      color: '#E9D8B4',
      align: 'center',
      letter_spacing: 0.3,
      uppercase: true,
    },
    {
      id: 'names',
      type: 'text',
      text: 'Hilbert &\nHilda',
      x: 20,
      y: 255,
      width: 320,
      height: 150,
      font: 'script',
      size: 56,
      color: '#F4EDE0',
      align: 'center',
    },
    {
      id: 'rule',
      type: 'shape',
      shape: 'line',
      fill: '#E9D8B4',
      x: 150,
      y: 420,
      width: 60,
      height: 1,
    },
    {
      id: 'date',
      type: 'text',
      text: '12 . 12 . 2026',
      x: 30,
      y: 435,
      width: 300,
      height: 18,
      font: 'sans',
      size: 10,
      color: '#F4EDE0',
      align: 'center',
      letter_spacing: 0.1,
    },
  ],
}
