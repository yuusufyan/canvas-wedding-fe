import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import AppShellLayout from '../AppShellLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { MenuItem } from '@/types/auth'

vi.mock('@/api/auth', () => ({
  login: vi.fn<() => Promise<void>>(),
  logout: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  getMe: vi.fn<() => Promise<void>>(),
}))

const page = { template: '<div>halaman</div>' }

function menu(
  key: string,
  label: string,
  path: string,
  sort: number,
  parent: string | null = null,
): MenuItem {
  return { key, label, path, icon: 'grid', parentKey: parent, sortOrder: sort }
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: page },
      { path: '/login', name: 'login', component: page },
      { path: '/dashboard', name: 'home', component: page },
      { path: '/users', name: 'users', component: page },
      { path: '/roles', name: 'roles', component: page },
      { path: '/admin/template', name: 'tpl', component: page },
      { path: '/admin/template/:id/editor', name: 'editor', component: page },
      { path: '/admin/membership', name: 'mem', component: page },
      { path: '/admin', name: 'adm', component: page },
    ],
  })
}

async function mountShell(router: Router, path = '/admin/template') {
  await router.push(path)
  await router.isReady()
  return mount(AppShellLayout, {
    attachTo: document.body,
    global: { plugins: [router] },
    slots: { default: '<p class="probe">isi</p>' },
  })
}

function signIn(role: string, menus: MenuItem[]): void {
  useAuthStore().$patch({
    isAuthenticated: true,
    profile: {
      id: 'u1',
      name: 'Admin Utama',
      email: 'admin@contoh.test',
      role: role.toLowerCase(),
    },
    menus,
  })
}

describe('AppShellLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.classList.add('blank-page')
  })

  it('TC-UI-F3-40: sidebar dibangun dari menus[] /auth/me berurutan dengan landmark dan halaman aktif', async () => {
    signIn('SuperAdmin', [
      menu('b', 'Template', '/admin/template', 20),
      menu('a', 'Dashboard', '/admin', 10),
      menu('c', 'Membership', '/admin/membership', 60),
    ])
    const wrapper = await mountShell(createTestRouter())

    expect(wrapper.findAll('.nk-sidebar__nav > ul > li').map((li) => li.text())).toEqual([
      'Dashboard',
      'Template',
      'Membership',
    ])
    expect(wrapper.find('nav[aria-label="Menu utama"]').exists()).toBe(true)
    expect(wrapper.find('main#konten-utama .probe').text()).toBe('isi')
    expect(wrapper.find('a[aria-current="page"]').text()).toBe('Template')
    expect(wrapper.find('.nk-usermenu__trigger').text()).toContain('Admin Utama')
    expect(wrapper.find('.nk-usermenu__trigger').text()).toContain('superadmin')
    expect(wrapper.find('.nk-usercard').exists()).toBe(false)
    expect(document.body.classList.contains('blank-page')).toBe(false)
    wrapper.unmount()
  })

  it('TC-UI-F3-41: menu anak ditampilkan di bawah induknya; ikon tidak dikenal memakai ikon bawaan', async () => {
    signIn('SuperAdmin', [
      menu('p', 'Induk', '/admin', 10),
      { ...menu('c', 'Anak', '/admin/template', 20, 'p'), icon: 'tidak-dikenal' },
    ])
    const wrapper = await mountShell(createTestRouter())

    expect(wrapper.findAll('.nk-sidebar__nav > ul > li')).toHaveLength(1)
    expect(wrapper.find('.nk-sidebar__sub').text()).toBe('Anak')
    wrapper.unmount()
  })

  it('TC-UI-F3-42: menus kosong memakai menu cadangan sesuai peran', async () => {
    signIn('SuperAdmin', [])
    const admin = await mountShell(createTestRouter())
    expect(admin.findAll('.nk-sidebar__nav a').map((a) => a.text())).toEqual([
      'Dashboard',
      'Pengguna & Role',
    ])
    admin.unmount()

    setActivePinia(createPinia())
    signIn('User', [])
    const user = await mountShell(createTestRouter())
    expect(user.findAll('.nk-sidebar__nav a').map((a) => a.text())).toEqual(['Beranda'])
    user.unmount()
  })

  it('TC-UI-F3-43: tombol menu membuka sidebar off-canvas, Escape menutup dan fokus kembali', async () => {
    signIn('SuperAdmin', [menu('a', 'Dashboard', '/admin', 10)])
    const wrapper = await mountShell(createTestRouter())
    const toggle = wrapper.find('.nk-topbar__menu')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.nk-app').classes()).toContain('is-menu-open')
    expect(wrapper.find('[data-testid="shell-backdrop"]').exists()).toBe(true)

    await wrapper.find('.nk-app').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.nk-app').classes()).not.toContain('is-menu-open')
    expect(document.activeElement).toBe(toggle.element)

    await toggle.trigger('click')
    await wrapper.find('[data-testid="shell-backdrop"]').trigger('click')
    expect(wrapper.find('.nk-app').classes()).not.toContain('is-menu-open')
    wrapper.unmount()
  })

  it('TC-UI-F3-44: sidebar tertutup setelah navigasi', async () => {
    signIn('SuperAdmin', [
      menu('a', 'Dashboard', '/admin', 10),
      menu('c', 'Membership', '/admin/membership', 60),
    ])
    const router = createTestRouter()
    const wrapper = await mountShell(router)

    await wrapper.find('.nk-topbar__menu').trigger('click')
    expect(wrapper.find('.nk-app').classes()).toContain('is-menu-open')
    await router.push('/admin/membership')
    await flushPromises()

    expect(wrapper.find('.nk-app').classes()).not.toContain('is-menu-open')
    wrapper.unmount()
  })

  it('TC-UI-F3-45: menu Dashboard tidak aktif di sub-rute lain, menu lain aktif di sub-rutenya', async () => {
    signIn('SuperAdmin', [
      menu('a', 'Dashboard', '/admin', 10),
      menu('b', 'Template', '/admin/template', 20),
    ])
    const wrapper = await mountShell(createTestRouter(), '/admin/template/abc/editor')

    const active = wrapper.findAll('a[aria-current="page"]').map((a) => a.text())
    expect(active).toEqual(['Template'])
    wrapper.unmount()
  })

  it('TC-UI-F3-46: keluar memanggil logout sekali dan mengarahkan ke login', async () => {
    signIn('SuperAdmin', [menu('a', 'Dashboard', '/admin', 10)])
    const router = createTestRouter()
    const wrapper = await mountShell(router)

    await wrapper.find('.nk-usermenu__trigger').trigger('click')
    const button = wrapper.find('[role="menuitem"]')
    expect(button.text()).toBe('Keluar')
    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(useAuthStore().isAuthenticated).toBe(false)
    wrapper.unmount()
  })
})
