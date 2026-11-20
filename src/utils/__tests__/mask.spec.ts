import { describe, expect, it } from 'vitest'
import { maskEmail } from '../mask'

describe('maskEmail', () => {
  it('TC-UI-F3-01: menyamarkan nama lokal dan mempertahankan domain', () => {
    expect(maskEmail('nadia@contoh.test')).toBe('n***@contoh.test')
  })

  it('TC-UI-F3-02: email yang sudah tersamar dari backend tidak diubah lagi', () => {
    expect(maskEmail('n***@contoh.test')).toBe('n***@contoh.test')
  })

  it('TC-UI-F3-03: nilai tanpa format email disamarkan penuh', () => {
    expect(maskEmail('bukan-email')).toBe('***')
    expect(maskEmail('@contoh.test')).toBe('***')
  })
})
