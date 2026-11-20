import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import PublicLayout from '../PublicLayout.vue'
import { useAuthStore } from '@/stores/auth'

function mountLayout() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/dashboard', name: 'home', component: { template: '<div />' } },
    ],
  })
  return mount(PublicLayout, { slots: { default: '<p>isi</p>' }, global: { plugins: [router] } })
}

describe('PublicLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.classList.add('blank-page')
  })

  it('TC-UI-F2-54: memiliki landmark header, nav, main, dan footer serta tautan lompat', () => {
    const wrapper = mountLayout()

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Navigasi utama"]').exists()).toBe(true)
    expect(wrapper.find('main#konten-utama').text()).toBe('isi')
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('a.nk-skip').attributes('href')).toBe('#konten-utama')
    expect(document.body.classList.contains('blank-page')).toBe(false)
    wrapper.unmount()
  })

  it('TC-UI-F2-55: hamburger membuka dan menutup menu, Escape serta klik tautan menutupnya', async () => {
    const wrapper = mountLayout()
    const toggle = wrapper.find('.nk-nav__toggle')
    const panel = wrapper.find('#nk-nav-panel')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(panel.classes()).toContain('is-open')

    await wrapper.find('.nk-public').trigger('keydown', { key: 'Escape' })
    expect(panel.classes()).not.toContain('is-open')

    await toggle.trigger('click')
    await panel.find('.nk-nav__links a').trigger('click')
    expect(panel.classes()).not.toContain('is-open')
    wrapper.unmount()
  })

  it('TC-UI-F2-56: tamu melihat Masuk dan Mulai gratis ke login, pengguna login melihat Dasbor', () => {
    const guest = mountLayout()
    const links = guest.findAll('.nk-nav__actions a')
    expect(links.map((a) => a.text())).toEqual(['Masuk', 'Mulai gratis'])
    expect(links.every((a) => a.attributes('href') === '/login')).toBe(true)
    guest.unmount()

    useAuthStore().$patch({ isAuthenticated: true })
    const member = mountLayout()
    const actions = member.findAll('.nk-nav__actions a')
    expect(actions.map((a) => a.text())).toEqual(['Dasbor'])
    expect(actions[0]?.attributes('href')).toBe('/dashboard')
    member.unmount()
  })
})
