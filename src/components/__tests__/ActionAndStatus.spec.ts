import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ActionMenu, { type ActionItem } from '../ActionMenu.vue'
import StatusPanel from '../StatusPanel.vue'
import UserMenu from '../UserMenu.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { useAuthStore } from '@/stores/auth'

const items: ActionItem[] = [
  { key: 'edit', label: 'Ubah', icon: 'edit-3' },
  { key: 'delete', label: 'Hapus', icon: 'trash-2', danger: true, separated: true },
]

describe('ActionMenu', () => {
  it('TC-UI-F5-17: membuka menu dengan role menu, fokus ke item pertama, pemisah, dan item bahaya', async () => {
    const wrapper = mount(ActionMenu, {
      attachTo: document.body,
      props: { items, label: 'Aksi untuk Rina' },
    })
    const trigger = wrapper.find('button[aria-haspopup="menu"]')
    expect(trigger.attributes('aria-label')).toBe('Aksi untuk Rina')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')
    await wrapper.vm.$nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const entries = wrapper.findAll('[role="menuitem"]')
    expect(entries.map((e) => e.text())).toEqual(['Ubah', 'Hapus'])
    expect(entries[1]!.classes()).toContain('nk-menu__item--danger')
    expect(wrapper.find('hr').exists()).toBe(true)
    expect(document.activeElement).toBe(entries[0]!.element)
    wrapper.unmount()
  })

  it('TC-UI-F5-18: memilih item mengirim key dan menutup; panah memindah fokus; Escape kembali ke pemicu', async () => {
    const wrapper = mount(ActionMenu, {
      attachTo: document.body,
      props: { items, label: 'Aksi' },
    })
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('.nk-menu').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(wrapper.findAll('[role="menuitem"]')[1]!.element)
    await wrapper.find('.nk-menu').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(wrapper.findAll('[role="menuitem"]')[0]!.element)

    await wrapper.find('.nk-menu').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('button[aria-haspopup="menu"]').element)

    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['delete']])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('TC-UI-F5-19: klik di luar menutup menu dan pemicu bisa dinonaktifkan', async () => {
    const wrapper = mount(ActionMenu, {
      attachTo: document.body,
      props: { items, label: 'Aksi' },
    })
    await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await wrapper.setProps({ disabled: true })
    expect(wrapper.find('button[aria-haspopup="menu"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('UserMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().$patch({
      profile: {
        id: 'u1',
        name: 'Admin Utama',
        email: 'admin@contoh.test',
        role: 'superadmin',
      },
    })
  })

  it('TC-UI-F5-20: menampilkan nama dan role, menu Keluar mengirim logout lalu menutup', async () => {
    const wrapper = mount(UserMenu, { attachTo: document.body })
    const trigger = wrapper.find('.nk-usermenu__trigger')
    expect(trigger.text()).toContain('Admin Utama')
    expect(trigger.text()).toContain('superadmin')
    expect(trigger.attributes('aria-label')).toBe('Menu akun Admin Utama')
    expect(wrapper.find('.nk-usermenu__avatar').text()).toBe('A')

    await trigger.trigger('click')
    await wrapper.vm.$nextTick()
    const item = wrapper.find('[role="menuitem"]')
    expect(item.text()).toBe('Keluar')
    expect(document.activeElement).toBe(item.element)
    await item.trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('TC-UI-F5-21: Escape menutup dan mengembalikan fokus; busy menonaktifkan Keluar', async () => {
    const wrapper = mount(UserMenu, { attachTo: document.body, props: { busy: true } })
    await wrapper.find('.nk-usermenu__trigger').trigger('click')
    expect(wrapper.find('[role="menuitem"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="menuitem"]').text()).toBe('Keluar…')

    await wrapper.find('.nk-usermenu').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.nk-usermenu__trigger').element)
    wrapper.unmount()
  })
})

describe('halaman status', () => {
  async function mountWithRouter(component: object) {
    const stub = { template: '<div />' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'landing', component: stub }],
    })
    await router.push('/')
    return mount(component, { attachTo: document.body, global: { plugins: [router] } })
  }

  it('TC-UI-F5-22: StatusPanel menampilkan ikon, judul h1 yang difokuskan, teks, dan aksi', () => {
    const wrapper = mount(StatusPanel, {
      attachTo: document.body,
      props: { icon: 'lock', title: 'Akses ditolak', tone: 'warning' },
      slots: { default: 'Penjelasan', actions: '<button class="aksi">Kembali</button>' },
    })

    expect(wrapper.find('h1').text()).toBe('Akses ditolak')
    expect(document.activeElement).toBe(wrapper.find('h1').element)
    expect(wrapper.find('.nk-auth__icon--warning').exists()).toBe(true)
    expect(wrapper.find('.nk-auth__lead').text()).toBe('Penjelasan')
    expect(wrapper.find('.aksi').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F5-23: 404 dan 403 memakai AuthLayout Niskala tanpa kelas Vuexy dan menawarkan satu tombol utama', async () => {
    const notFound = await mountWithRouter(NotFoundView)
    expect(notFound.find('h1').text()).toBe('Halaman tidak ditemukan')
    expect(notFound.find('.misc-wrapper').exists()).toBe(false)
    expect(notFound.find('main a.nk-btn--primary').attributes('href')).toBe('/')
    expect(document.title).toBe('Halaman tidak ditemukan | Niskala Daisy')
    notFound.unmount()

    const forbidden = await mountWithRouter(ForbiddenView)
    expect(forbidden.find('h1').text()).toBe('Kamu tidak punya akses')
    expect(forbidden.text()).toContain('hanya untuk administrator')
    expect(forbidden.find('main a.nk-btn--primary').text()).toContain('Kembali ke beranda')
    forbidden.unmount()
  })
})
