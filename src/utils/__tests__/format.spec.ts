import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate } from '../format'

describe('formatCurrency', () => {
  it('formats decimal strings and numbers into IDR currency', () => {
    expect(formatCurrency('25000.00')).toMatch(/Rp\s*25\.000,00/)
    expect(formatCurrency(12500.5)).toMatch(/Rp\s*12\.500,50/)
  })

  it('returns fallback for non-numeric input', () => {
    expect(formatCurrency('not-a-number')).toBe('Rp 0,00')
  })
})

describe('formatDate', () => {
  it('formats a valid ISO timestamp in Indonesian locale', () => {
    expect(formatDate('2026-11-08T10:00:00.000Z')).toMatch(/2026/)
  })

  it('returns the raw value for an invalid date', () => {
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal')
  })
})
