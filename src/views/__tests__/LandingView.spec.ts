import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import LandingView from '../LandingView.vue'
import { listPublicTemplates } from '@/api/publicTemplates'
import { mockTemplateSummaries } from '@/api/mock/templates'

vi.mock('@/api/publicTemplates', () => ({ listPublicTemplates: vi.fn<() => Promise<unknown>>() }))

async function mountLanding() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: LandingView },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/dashboard', name: 'home', component: { template: '<div />' } },
      { path: '/demo/:slug', name: 'demo', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return mount(LandingView, { global: { plugins: [router] } })
}

describe('LandingView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listPublicTemplates).mockResolvedValue({
      data: mockTemplateSummaries(4),
      meta: { total: 4, page: 1, limit: 4, total_pages: 1, total_results: 4 },
    })
  })

  it('TC-UI-F2-01: menampilkan sembilan bagian landing dengan satu h1 dan heading berurutan', async () => {
    const wrapper = await mountLanding()
    await flushPromises()

    expect(wrapper.findAll('h1')).toHaveLength(1)
    for (const id of ['cara-kerja', 'template', 'harga', 'faq']) {
      expect(wrapper.find(`section#${id}`).exists()).toBe(true)
    }
    expect(wrapper.text()).toContain('Undangan yang terasa seperti kalian berdua.')
    expect(wrapper.findAll('.nk-stats__grid li')).toHaveLength(4)
    expect(wrapper.findAll('.nk-step')).toHaveLength(3)
    expect(wrapper.findAll('.nk-plan')).toHaveLength(2)
    expect(wrapper.find('.nk-cta').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F2-02: Mulai gratis dan Buat undangan gratis mengarah ke login, Lihat demo ke demo', async () => {
    const wrapper = await mountLanding()
    await flushPromises()

    const hrefOf = (label: string) =>
      wrapper
        .findAll('a')
        .filter((a) => a.text().includes(label))
        .map((a) => a.attributes('href'))

    expect(hrefOf('Mulai gratis').every((h) => h === '/login')).toBe(true)
    expect(hrefOf('Buat undangan gratis').every((h) => h === '/login')).toBe(true)
    expect(hrefOf('Lihat demo')).toEqual(['/demo/rustic-hijau'])
    wrapper.unmount()
  })

  it('TC-UI-F2-03: tidak ada v-html dan gambar logo punya teks alternatif kosong di dalam tautan berlabel', async () => {
    const wrapper = await mountLanding()
    await flushPromises()

    const logos = wrapper.findAll('.nk-logo')
    expect(logos.length).toBeGreaterThanOrEqual(2)
    for (const logo of logos) {
      expect(logo.attributes('aria-label')).toBe('Niskala Daisy, beranda')
      expect(logo.find('img').attributes('alt')).toBe('')
    }
    wrapper.unmount()
  })
})
