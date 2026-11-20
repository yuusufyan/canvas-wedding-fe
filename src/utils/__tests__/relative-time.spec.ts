import { describe, expect, it } from 'vitest'
import { formatNumber, formatRelativeTime } from '../relative-time'

const NOW = Date.parse('2026-11-20T12:00:00Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('formatRelativeTime', () => {
  it('TC-UI-F3-04: memilih satuan terbesar yang terpenuhi', () => {
    expect(formatRelativeTime(ago(30_000), NOW)).toBe('baru saja')
    expect(formatRelativeTime(ago(5 * MIN), NOW)).toBe('5 menit lalu')
    expect(formatRelativeTime(ago(3 * HOUR), NOW)).toBe('3 jam lalu')
    expect(formatRelativeTime(ago(2 * DAY), NOW)).toBe('2 hari lalu')
    expect(formatRelativeTime(ago(8 * DAY), NOW)).toBe('1 minggu lalu')
    expect(formatRelativeTime(ago(65 * DAY), NOW)).toBe('2 bulan lalu')
  })

  it('TC-UI-F3-05: waktu di masa depan dan tanggal tidak valid ditangani', () => {
    expect(formatRelativeTime(new Date(NOW + DAY).toISOString(), NOW)).toBe('baru saja')
    expect(formatRelativeTime('bukan-tanggal', NOW)).toBe('bukan-tanggal')
  })
})

describe('formatNumber', () => {
  it('TC-UI-F3-06: memakai pemisah ribuan id-ID', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
})
