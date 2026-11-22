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

  it('TC-UI-F2-04: landing dan demo publik, dashboard admin di /admin (SuperAdmin saja)', () => {
    const landing = router.resolve('/')
    const demo = router.resolve('/demo/rustic-hijau')
    const dashboard = router.resolve('/admin')

    expect(landing.name).toBe('landing')
    expect(landing.meta.public).toBe(true)
    expect(demo.name).toBe('demo')
    expect(demo.meta.public).toBe(true)
    expect(demo.params.slug).toBe('rustic-hijau')
    expect(dashboard.name).toBe('home')
    expect(dashboard.meta.public).toBeUndefined()
    expect(dashboard.meta.requireSuperAdmin).toBe(true)
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

  it('TC-UI-F5-01: rute lama /dashboard, /users, dan /roles dialihkan ke rute baru', () => {
    const redirectOf = (path: string) => router.getRoutes().find((r) => r.path === path)!.redirect
    expect(redirectOf('/dashboard')).toEqual({ name: 'home' })
    expect(redirectOf('/users')).toEqual({ name: 'admin-users' })
    expect(redirectOf('/roles')).toEqual({ name: 'admin-roles' })
  })

  it('TC-UI-F5-02: Pengguna & Role punya tiga rute SuperAdmin; halaman 403 publik', () => {
    expect(router.resolve('/admin/pengguna').name).toBe('admin-users')
    expect(router.resolve('/admin/pengguna/role').name).toBe('admin-roles')
    const access = router.resolve('/admin/pengguna/role/abc')
    expect(access.name).toBe('admin-role-access')
    expect(access.params.id).toBe('abc')
    for (const path of ['/admin/pengguna', '/admin/pengguna/role', '/admin/pengguna/role/abc']) {
      expect(router.resolve(path).meta.requireSuperAdmin).toBe(true)
    }
    expect(router.resolve('/403').name).toBe('forbidden')
    expect(router.resolve('/403').meta.public).toBe(true)
  })
})
