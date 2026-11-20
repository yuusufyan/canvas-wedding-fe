import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCooldown } from '../useCooldown'

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('TC-UI-F4-07: tidak aktif sebelum start, lalu menghitung mundur sampai nol', () => {
    const scope = effectScope()
    const cooldown = scope.run(() => useCooldown(3))!
    expect(cooldown.active.value).toBe(false)
    expect(cooldown.label.value).toBe('00:00')

    cooldown.start()
    expect(cooldown.active.value).toBe(true)
    expect(cooldown.label.value).toBe('00:03')

    vi.advanceTimersByTime(2000)
    expect(cooldown.remaining.value).toBe(1)
    vi.advanceTimersByTime(5000)
    expect(cooldown.remaining.value).toBe(0)
    expect(cooldown.active.value).toBe(false)
    scope.stop()
  })

  it('TC-UI-F4-08: start ulang memulai dari awal dan berhenti saat scope selesai', () => {
    const scope = effectScope()
    const cooldown = scope.run(() => useCooldown(60))!

    cooldown.start()
    vi.advanceTimersByTime(10_000)
    expect(cooldown.label.value).toBe('00:50')
    cooldown.start()
    expect(cooldown.label.value).toBe('01:00')

    scope.stop()
    vi.advanceTimersByTime(5000)
    expect(cooldown.remaining.value).toBe(60)
  })
})
