import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import VerticalLayout from '../VerticalLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { RoleSummary } from '@/types/auth'

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/users', name: 'users', component: { template: '<div>users</div>' } },
      { path: '/roles', name: 'roles', component: { template: '<div>roles</div>' } },
    ],
  })
}

async function mountLayout(router: Router) {
  await router.push('/')
  await router.isReady()
  return mount(VerticalLayout, {
    global: { plugins: [router] },
    slots: { default: '<div class="probe">isi halaman</div>' },
  })
}

function fillProfile(name: string, role: RoleSummary): void {
  const store = useAuthStore()
  store.$patch({
    isAuthenticated: true,
    profile: {
      id: 'u-1',
      name,
      email: 'user@example.com',
      role,
      is_active: true,
    },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('VerticalLayout', () => {
  it('TC-UNIT-37: shows the name and role name from the loaded profile in the navbar', async () => {
    fillProfile('Super Administrator', { id: 'role-superadmin', name: 'SuperAdmin' })
    const wrapper = await mountLayout(createTestRouter())

    expect(wrapper.find('.user-name').text()).toBe('Super Administrator')
    expect(wrapper.find('.user-status').text()).toBe('SuperAdmin')
  })

  it('TC-UNIT-38: shows the Beranda menu item for non-superadmin user and hides management menus', async () => {
    fillProfile('Regular Staff', { id: 'role-staff', name: 'Staff' })
    const wrapper = await mountLayout(createTestRouter())

    const navText = wrapper.find('.navigation-main').text()
    expect(navText).toContain('Beranda')
    expect(navText).not.toContain('Pengguna')
    expect(navText).not.toContain('Role')
  })

  it('shows Pengguna and Role menu items when user is SuperAdmin', async () => {
    fillProfile('Super Administrator', { id: 'role-superadmin', name: 'SuperAdmin' })
    const wrapper = await mountLayout(createTestRouter())

    const navText = wrapper.find('.navigation-main').text()
    expect(navText).toContain('Beranda')
    expect(navText).toContain('Pengguna')
    expect(navText).toContain('Role')
  })

  it('TC-UNIT-39: renders a malicious name/role name as literal text, never as markup', async () => {
    const payload = '<img src=x onerror=alert(1)>'
    fillProfile(payload, { id: 'role-x', name: payload })
    const wrapper = await mountLayout(createTestRouter())

    expect(wrapper.find('.user-name img').exists()).toBe(false)
    expect(wrapper.find('.user-status img').exists()).toBe(false)
    expect(wrapper.find('img[onerror]').exists()).toBe(false)
    expect(wrapper.find('.user-name').text()).toBe(payload)
  })
})
