import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import DemoView from '../DemoView.vue'
import { ApiError } from '@/api/http'
import { getTemplateDemo } from '@/api/publicTemplates'
import { mockTemplateDemo } from '@/api/mock/templates'

vi.mock('@/api/publicTemplates', () => ({ getTemplateDemo: vi.fn<() => Promise<unknown>>() }))

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: { template: '<div>landing</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/demo/:slug', name: 'demo', component: DemoView },
    ],
  })
}

async function mountDemo(router: Router, slug = 'rustic-hijau') {
  await router.push(`/demo/${slug}`)
  await router.isReady()
  return mount(DemoView, { global: { plugins: [router] } })
}

describe('DemoView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(getTemplateDemo).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('TC-UI-F2-46: memuat demo lalu menampilkan pemutar, bagian, dan info template', async () => {
    vi.mocked(getTemplateDemo).mockResolvedValue(mockTemplateDemo('rustic-hijau')!)

    const wrapper = await mountDemo(createTestRouter())
    expect(wrapper.find('[data-testid="demo-loading"]').exists()).toBe(true)
    await flushPromises()

    expect(getTemplateDemo).toHaveBeenCalledWith('rustic-hijau')
    expect(wrapper.find('h1').text()).toContain('Hilbert & Hilda')
    expect(wrapper.findAll('.nk-sections button')).toHaveLength(8)
    expect(wrapper.text()).toContain('Animasi: Naik')
    expect(wrapper.find('a[href^="/login"]').text()).toContain('Pakai template ini')
    wrapper.unmount()
  })

  it('TC-UI-F2-47: slug tidak dikenal menampilkan demo tidak ditemukan', async () => {
    vi.mocked(getTemplateDemo).mockRejectedValue(new ApiError(404))

    const wrapper = await mountDemo(createTestRouter(), 'tidak-ada')
    await flushPromises()

    expect(wrapper.text()).toContain('Demo tidak ditemukan')
    expect(wrapper.find('.nk-stage').exists()).toBe(false)
  })

  it('TC-UI-F2-48: gagal muat menampilkan pesan generik dan coba lagi', async () => {
    vi.mocked(getTemplateDemo)
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValueOnce(mockTemplateDemo('rustic-hijau')!)

    const wrapper = await mountDemo(createTestRouter())
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Demo belum bisa dimuat')

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.nk-stage').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F2-49: tombol tutup kembali ke landing bila tidak ada riwayat', async () => {
    vi.mocked(getTemplateDemo).mockResolvedValue(mockTemplateDemo('rustic-hijau')!)
    const router = createTestRouter()
    const wrapper = await mountDemo(router)
    await flushPromises()

    await wrapper.find('button[aria-label="Tutup demo"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('landing')
    wrapper.unmount()
  })

  it('TC-UI-F2-50: bagikan demo menyalin tautan dan melaporkan hasilnya', async () => {
    vi.mocked(getTemplateDemo).mockResolvedValue(mockTemplateDemo('rustic-hijau')!)
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const wrapper = await mountDemo(createTestRouter())
    await flushPromises()
    await wrapper.find('button[aria-label="Bagikan demo"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="status"]').text()).toBe('Tautan demo disalin')

    writeText.mockRejectedValue(new Error('ditolak'))
    await wrapper.find('button[aria-label="Bagikan demo"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="status"]').text()).toContain('tidak bisa disalin')
    wrapper.unmount()
  })
})
