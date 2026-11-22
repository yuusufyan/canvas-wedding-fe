import { describe, expect, it } from 'vitest'
import { passwordBytes, passwordStrength } from '../password'
import { validateEmail, validateName, validateNewPassword } from '../validation'

describe('passwordBytes', () => {
  it('TC-UI-F4-03: menghitung byte UTF-8, bukan jumlah karakter', () => {
    expect(passwordBytes('abc')).toBe(3)
    expect(passwordBytes('é')).toBe(2)
    expect(passwordBytes('😀')).toBe(4)
  })
})

describe('validateNewPassword', () => {
  it('TC-UI-F4-04: batas 8 dan 72 byte, termasuk karakter multibyte', () => {
    expect(validateNewPassword('')).toBe('Kata sandi wajib diisi.')
    expect(validateNewPassword('abc12')).toBe('Kata sandi minimal 8 karakter.')
    expect(validateNewPassword('abcdefg')).not.toBe('') // secret-scan:ignore nilai palsu untuk test
    expect(validateNewPassword('abcdefgh')).toBe('') // secret-scan:ignore nilai palsu untuk test
    // 4 emoji = 16 byte (hanya 4 karakter) lolos batas minimum byte
    expect(validateNewPassword('😀😀')).toBe('')
    expect(validateNewPassword('a'.repeat(72))).toBe('')
    expect(validateNewPassword('a'.repeat(73))).toContain('maksimal 72 byte')
    // 37 karakter "é" = 74 byte meski hanya 37 karakter
    expect(validateNewPassword('é'.repeat(37))).toContain('maksimal 72 byte')
  })
})

describe('validateEmail dan validateName', () => {
  it('TC-UI-F4-05: email wajib dan berformat benar; nama wajib dan maksimal 100', () => {
    expect(validateEmail('  ')).toBe('Email wajib diisi.')
    expect(validateEmail('hilda@')).toBe('Format email tidak valid.')
    expect(validateEmail(`${'a'.repeat(250)}@x.id`)).toBe('Format email tidak valid.')
    expect(validateEmail(' hilda@contoh.test ')).toBe('')

    expect(validateName(' ')).toBe('Nama lengkap wajib diisi.')
    expect(validateName('x'.repeat(101))).toContain('maksimal 100')
    expect(validateName('Hilda Prameswari')).toBe('')
  })
})

describe('passwordStrength', () => {
  it('TC-UI-F4-06: tingkat naik dengan panjang dan ragam karakter; kosong bernilai nol', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('abc12')).toBe(1)
    expect(passwordStrength('abcdefgh')).toBe(1)
    expect(passwordStrength('abcdefghijkl')).toBe(2)
    expect(passwordStrength('Abcdefgh1')).toBe(3)
    expect(passwordStrength('Niskala2026!')).toBe(4)
  })
})
