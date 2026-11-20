import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { BREAKPOINTS, useMinWidth } from '../useBreakpoint'

describe('useMinWidth', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('TC-UI-F3-23: tanpa matchMedia dianggap layar lebar', () => {
    const scope = effectScope()
    expect(scope.run(() => useMinWidth(BREAKPOINTS.md))!.value).toBe(true)
    scope.stop()
  })

  it('TC-UI-F3-24: mengikuti perubahan media query dan berhenti saat scope selesai', () => {
    let listener: (event: MediaQueryListEvent) => void = () => {}
    const remove = vi.fn<() => void>()
    vi.stubGlobal(
      'matchMedia',
      vi.fn<(query: string) => unknown>().mockReturnValue({
        matches: false,
        addEventListener: (_: string, fn: typeof listener) => (listener = fn),
        removeEventListener: remove,
      }),
    )
    const scope = effectScope()
    const matches = scope.run(() => useMinWidth(768))!
    expect(matches.value).toBe(false)

    listener({ matches: true } as MediaQueryListEvent)
    expect(matches.value).toBe(true)

    scope.stop()
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
