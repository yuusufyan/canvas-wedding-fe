import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import TemplateGallery from '../TemplateGallery.vue'
import { ApiError } from '@/api/http'
import { listPublicTemplates } from '@/api/publicTemplates'
import { mockTemplateSummaries } from '@/api/mock/templates'
import type { PaginationMeta } from '@/types/api'

vi.mock('@/api/publicTemplates', () => ({ listPublicTemplates: vi.fn<() => Promise<unknown>>() }))

const meta: PaginationMeta = { total: 4, page: 1, limit: 4, totalPages: 1, totalResults: 4 }

async function mountGallery() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/demo/:slug', name: 'demo', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
  const wrapper = mount(TemplateGallery, { global: { plugins: [router] } })
  return wrapper
}

describe('TemplateGallery', () => {
  beforeEach(() => {
    vi.mocked(listPublicTemplates).mockReset()
  })

  it('TC-UI-F2-43: menampilkan skeleton saat memuat lalu kartu template', async () => {
    let resolve: (value: {
      data: ReturnType<typeof mockTemplateSummaries>
      meta: PaginationMeta
    }) => void = () => {}
    vi.mocked(listPublicTemplates).mockReturnValue(new Promise((r) => (resolve = r)))

    const wrapper = await mountGallery()
    expect(wrapper.find('[data-testid="gallery-loading"]').exists()).toBe(true)

    resolve({ data: mockTemplateSummaries(4), meta })
    await flushPromises()

    expect(wrapper.find('[data-testid="gallery-list"]').exists()).toBe(true)
    expect(wrapper.findAll('li')).toHaveLength(4)
    expect(wrapper.text()).toContain('Rustic Hijau')
    expect(wrapper.text()).toContain('Premium')
    expect(
      wrapper.find('a[aria-label="Lihat demo template Rustic Hijau"]').attributes('href'),
    ).toBe('/demo/rustic-hijau')
  })

  it('TC-UI-F2-44: state kosong menjelaskan template segera hadir', async () => {
    vi.mocked(listPublicTemplates).mockResolvedValue({ data: [], meta })

    const wrapper = await mountGallery()
    await flushPromises()

    expect(wrapper.text()).toContain('Template segera hadir')
    expect(wrapper.find('[data-testid="gallery-list"]').exists()).toBe(false)
  })

  it('TC-UI-F2-45: error menampilkan pesan generik dan tombol coba lagi memuat ulang', async () => {
    vi.mocked(listPublicTemplates)
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValueOnce({ data: mockTemplateSummaries(4), meta })

    const wrapper = await mountGallery()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Template belum bisa dimuat')
    expect(wrapper.text()).not.toContain('500')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(listPublicTemplates).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="gallery-list"]').exists()).toBe(true)
  })
})
