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

  it('TC-UI-F3-71: rute admin hanya SuperAdmin; menu tanpa halaman memakai halaman segera hadir', () => {
    for (const path of [
      '/admin/template',
      '/admin/membership',
      '/admin/undangan',
      '/admin/tamu',
      '/admin/pengaturan',
    ]) {
      expect(router.resolve(path).meta.requireSuperAdmin).toBe(true)
    }
    expect(router.resolve('/admin/template').name).toBe('admin-templates')
    expect(router.resolve('/admin/membership').name).toBe('admin-membership')
    expect(router.resolve('/admin/template/abc/editor').name).toBe('admin-template-editor')
    expect(router.resolve('/admin/tamu').name).toBe('admin-coming-soon')
    expect(router.resolve('/app').name).toBe('app-coming-soon')
    expect(router.resolve('/app/budget').name).toBe('app-coming-soon')
  })

  it('TC-UI-F3-72: /admin dan /admin/pengguna dialihkan ke halaman lama', () => {
    expect(router.resolve('/admin').redirectedFrom).toBeUndefined()
    const admin = router.getRoutes().find((r) => r.path === '/admin')!
    const users = router.getRoutes().find((r) => r.path === '/admin/pengguna')!
    expect(admin.redirect).toEqual({ name: 'home' })
    expect(users.redirect).toEqual({ name: 'users' })
  })
})
