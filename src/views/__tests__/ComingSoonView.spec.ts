import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ComingSoonView from '../ComingSoonView.vue'
import { useAuthStore } from '@/stores/auth'

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: { template: '<div />' } },
      { path: '/dashboard', name: 'home', component: { template: '<div />' } },
      { path: '/admin/tamu', name: 'tamu', component: ComingSoonView },
      {
        path: '/admin/template/:id/editor',
        name: 'admin-template-editor',
        component: ComingSoonView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mount(ComingSoonView, { global: { plugins: [router] } })
}

describe('ComingSoonView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('TC-UI-F3-69: memakai label menu backend dan tautan kembali ke dasbor', async () => {
    useAuthStore().$patch({
      menus: [{ key: 'admin.guests', label: 'Tamu', path: '/admin/tamu', sortOrder: 40 }],
    })
    const wrapper = await mountAt('/admin/tamu')

    expect(wrapper.find('h1').text()).toBe('Tamu segera hadir')
    expect(wrapper.find('main a').attributes('href')).toBe('/dashboard')
    expect(document.title).toBe('Segera hadir | Niskala Daisy')
  })

  it('TC-UI-F3-70: editor template menyebut Editor Canvas; rute tanpa menu memakai judul generik', async () => {
    const editor = await mountAt('/admin/template/abc/editor')
    expect(editor.find('h1').text()).toBe('Editor Canvas segera hadir')

    const other = await mountAt('/admin/tamu')
    expect(other.find('h1').text()).toBe('Halaman ini segera hadir')
  })
})
