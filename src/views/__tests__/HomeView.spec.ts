import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import HomeView from '../HomeView.vue'
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

async function mountHome(router: Router) {
  await router.push('/')
  await router.isReady()
  return mount(HomeView, { global: { plugins: [router] } })
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

describe('HomeView', () => {
  it('TC-UNIT-40: greets the user by name', async () => {
    fillProfile('Super Administrator', { id: 'role-superadmin', name: 'SuperAdmin' })
    const wrapper = await mountHome(createTestRouter())

    expect(wrapper.find('h1').text()).toBe('Halo, Super Administrator!')
    expect(wrapper.text()).toContain('Anda masuk sebagai')
    expect(wrapper.text()).toContain('SuperAdmin')
  })

  it('renders management shortcuts for SuperAdmin', async () => {
    fillProfile('Super Administrator', { id: 'role-superadmin', name: 'SuperAdmin' })
    const wrapper = await mountHome(createTestRouter())

    expect(wrapper.text()).toContain('Manajemen Pengguna')
    expect(wrapper.text()).toContain('Manajemen Role')
  })

  it('TC-UNIT-41: renders a malicious name as literal text in the greeting', async () => {
    const payload = '<img src=x onerror=alert(1)>'
    fillProfile(payload, { id: 'role-superadmin', name: 'SuperAdmin' })
    const wrapper = await mountHome(createTestRouter())

    expect(wrapper.find('h1 img').exists()).toBe(false)
    expect(wrapper.find('h1').text()).toBe(`Halo, ${payload}!`)
  })
})
