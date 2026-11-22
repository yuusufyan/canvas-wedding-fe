import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/http'
import { describeError } from '../api-error'

describe('describeError', () => {
  it('TC-UI-F5-64: 409 dipetakan per pesan BE ke teks Indonesia yang berbeda tanpa teks mentah', () => {
    const email = describeError(new ApiError(409, 'Email already registered'), 'cadangan')
    const self = describeError(
      new ApiError(409, 'You cannot deactivate, demote, or delete yourself'),
      'cadangan',
    )
    const last = describeError(
      new ApiError(409, 'At least one active SuperAdmin must remain'),
      'cadangan',
    )

    expect(new Set([email, self, last]).size).toBe(3)
    expect(email).toContain('Email sudah terdaftar')
    expect(self).toContain('akunmu sendiri')
    expect(last).toContain('minimal satu SuperAdmin aktif')
    for (const text of [email, self, last]) {
      expect(text).not.toMatch(/already|cannot|must remain/i)
    }
  })

  it('TC-UI-F5-65: 409 tanpa pesan dikenal memakai teks cadangan; tanpa cadangan jadi generik', () => {
    expect(describeError(new ApiError(409, 'Pesan baru'), 'cadangan')).toBe('cadangan')
    expect(describeError(new ApiError(409), 'cadangan')).toBe('cadangan')
    expect(describeError(new ApiError(409))).toBe('Terjadi kendala. Coba lagi sebentar lagi.')
  })

  it('TC-UI-F5-66: 403, 404, jaringan, dan error lain', () => {
    expect(describeError(new ApiError(403))).toBe('Kamu tidak punya akses untuk tindakan ini.')
    expect(describeError(new ApiError(404))).toContain('Data tidak ditemukan')
    expect(describeError(new ApiError(0))).toContain('Tidak bisa terhubung')
    expect(describeError(new Error('x'))).toBe('Terjadi kendala. Coba lagi sebentar lagi.')
  })
})
