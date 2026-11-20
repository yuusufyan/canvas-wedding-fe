import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    const { toasts, dismiss } = useToast()
    const list = toasts.value
    list.forEach((t) => dismiss(t.id))
    vi.useRealTimers()
  })

  it('TC-UI-F3-21: toast sukses dan error muncul lalu hilang sendiri', () => {
    const toast = useToast()

    toast.success('Tersimpan')
    toast.error('Gagal')
    expect(toast.toasts.value.map((t) => [t.tone, t.message])).toEqual([
      ['success', 'Tersimpan'],
      ['error', 'Gagal'],
    ])

    vi.advanceTimersByTime(5000)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('TC-UI-F3-22: maksimum tiga toast dan dapat ditutup manual', () => {
    const toast = useToast()
    for (const n of [1, 2, 3, 4]) {
      toast.success(`pesan ${n}`)
    }
    expect(toast.toasts.value.map((t) => t.message)).toEqual(['pesan 2', 'pesan 3', 'pesan 4'])

    const first = toast.toasts.value[0]!
    toast.dismiss(first.id)
    expect(toast.toasts.value).toHaveLength(2)
  })
})
