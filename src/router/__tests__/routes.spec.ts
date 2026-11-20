import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import router from '../index'

function location(path: string): RouteLocationNormalized {
  return router.resolve(path) as unknown as RouteLocationNormalized
}

describe('router', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('TC-UI-F2-04: landing dan demo publik, dashboard pindah ke /dashboard', () => {
    const landing = router.resolve('/')
    const demo = router.resolve('/demo/rustic-hijau')
    const dashboard = router.resolve('/dashboard')

    expect(landing.name).toBe('landing')
    expect(landing.meta.public).toBe(true)
    expect(demo.name).toBe('demo')
    expect(demo.meta.public).toBe(true)
    expect(demo.params.slug).toBe('rustic-hijau')
    expect(dashboard.name).toBe('home')
    expect(dashboard.meta.public).toBeUndefined()
    expect(router.resolve('/users').meta.requireSuperAdmin).toBe(true)
  })

  it('TC-UI-F2-05: tautan hash menggulir halus kecuali gerak dikurangi', () => {
    const scroll = (to: string, from: string, saved: { left: number; top: number } | null) =>
      router.options.scrollBehavior!(location(to), location(from), saved)

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    expect(scroll('/#harga', '/', null)).toMatchObject({ el: '#harga', behavior: 'smooth' })

    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(scroll('/#harga', '/', null)).toMatchObject({ el: '#harga', behavior: 'auto' })

    expect(scroll('/demo/x', '/', null)).toEqual({ top: 0 })
    expect(scroll('/', '/demo/x', { left: 0, top: 120 })).toEqual({ left: 0, top: 120 })
    expect(scroll('/', '/', null)).toBe(false)
  })
})
