import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCountdown } from '../useCountdown'

const TARGET = '2026-12-12T08:00:00+07:00'
const TARGET_MS = Date.parse(TARGET)

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('TC-UI-F2-20: memecah selisih waktu menjadi hari, jam, menit, dan detik', () => {
    const now = TARGET_MS - (22 * 86400 + 8 * 3600 + 41 * 60 + 17) * 1000
    const scope = effectScope()
    const result = scope.run(() => useCountdown(TARGET, { now: () => now }))!

    expect(result.days.value).toBe(22)
    expect(result.hours.value).toBe(8)
    expect(result.minutes.value).toBe(41)
    expect(result.seconds.value).toBe(17)
    expect(result.isPast.value).toBe(false)
    scope.stop()
  })

  it('TC-UI-F2-21: tanggal yang sudah lewat atau tidak valid menjadi nol', () => {
    const scope = effectScope()
    const past = scope.run(() => useCountdown(TARGET, { now: () => TARGET_MS + 5000 }))!
    const invalid = scope.run(() => useCountdown('bukan-tanggal', { now: () => TARGET_MS }))!

    expect(past.days.value).toBe(0)
    expect(past.isPast.value).toBe(true)
    expect(invalid.seconds.value).toBe(0)
    scope.stop()
  })

  it('TC-UI-F2-22: menghitung ulang tiap interval dan berhenti saat scope selesai', () => {
    let now = TARGET_MS - 10_000
    const scope = effectScope()
    const result = scope.run(() => useCountdown(TARGET, { now: () => now, intervalMs: 1000 }))!
    expect(result.seconds.value).toBe(10)

    now += 3000
    vi.advanceTimersByTime(1000)
    expect(result.seconds.value).toBe(7)

    scope.stop()
    now += 3000
    vi.advanceTimersByTime(5000)
    expect(result.seconds.value).toBe(7)
  })
})
