import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { formatClock, usePlayer } from '../usePlayer'

function setup(autoStart = false) {
  const scope = effectScope()
  const player = scope.run(() => usePlayer({ totalSeconds: 40, pageCount: 4, autoStart }))!
  return { scope, player }
}

describe('usePlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('TC-UI-F2-23: waktu dibagi rata ke tiap bagian dan indeks mengikuti posisi', () => {
    const { scope, player } = setup()

    expect(player.currentIndex.value).toBe(0)
    player.seek(25)
    expect(player.currentIndex.value).toBe(2)
    expect(player.progressOf(1)).toBe(1)
    expect(player.progressOf(2)).toBeCloseTo(0.5)
    expect(player.progressOf(3)).toBe(0)
    player.seek(999)
    expect(player.elapsed.value).toBe(40)
    expect(player.currentIndex.value).toBe(3)
    scope.stop()
  })

  it('TC-UI-F2-24: next, prev, dan seekToPage dibatasi di rentang bagian', () => {
    const { scope, player } = setup()

    player.next()
    expect(player.currentIndex.value).toBe(1)
    player.seek(10 + 5)
    player.prev()
    expect(player.elapsed.value).toBe(10)
    player.prev()
    expect(player.currentIndex.value).toBe(0)
    player.prev()
    expect(player.elapsed.value).toBe(0)
    player.seekToPage(99)
    expect(player.currentIndex.value).toBe(3)
    player.next()
    expect(player.currentIndex.value).toBe(3)
    scope.stop()
  })

  it('TC-UI-F2-25: pemutaran maju lewat timer, berhenti di akhir, dan bisa diputar ulang', async () => {
    const { scope, player } = setup()

    player.play()
    await nextTick()
    vi.advanceTimersByTime(5000)
    expect(player.elapsed.value).toBeGreaterThan(4)
    expect(player.playing.value).toBe(true)

    player.advance(1000)
    expect(player.elapsed.value).toBe(40)
    expect(player.playing.value).toBe(false)

    player.toggle()
    expect(player.elapsed.value).toBe(0)
    expect(player.playing.value).toBe(true)
    player.toggle()
    expect(player.playing.value).toBe(false)
    scope.stop()
  })

  it('TC-UI-F2-26: mode otomatis mati menghentikan pemutaran di akhir bagian', () => {
    const { scope, player } = setup(true)

    player.auto.value = false
    player.advance(9)
    expect(player.playing.value).toBe(true)
    player.advance(2)
    expect(player.playing.value).toBe(false)
    expect(player.currentIndex.value).toBe(0)

    player.auto.value = true
    player.play()
    player.advance(2)
    expect(player.currentIndex.value).toBe(1)
    scope.stop()
  })

  it('TC-UI-F2-27: advance diabaikan saat jeda dan formatClock memakai mm:ss', () => {
    const { scope, player } = setup()

    player.advance(5)
    expect(player.elapsed.value).toBe(0)
    expect(formatClock(18.9)).toBe('00:18')
    expect(formatClock(125)).toBe('02:05')
    expect(formatClock(-3)).toBe('00:00')
    scope.stop()
  })

  it('TC-UI-F2-28: durasi nol tidak menimbulkan pembagian nol', () => {
    const scope = effectScope()
    const player = scope.run(() => usePlayer({ totalSeconds: 0, pageCount: 0 }))!

    expect(player.currentIndex.value).toBe(0)
    expect(player.progressOf(0)).toBe(0)
    scope.stop()
  })
})
