import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminTemplatesView from '../AdminTemplatesView.vue'
import { ApiError } from '@/api/http'
import { mockCover } from '@/api/mock/templates'
import {
  archiveTemplate,
  createTemplate,
  deleteTemplate,
  getTemplateCounts,
  listTemplates,
  publishTemplate,
  updateTemplate,
} from '@/api/templates'
import { useToast } from '@/composables/useToast'
import type { AdminTemplate, TemplateCounts } from '@/types/admin'
import type { PaginatedResult } from '@/types/api'

vi.mock('@/api/templates', () => ({
  listTemplates: vi.fn<() => Promise<unknown>>(),
  getTemplateCounts: vi.fn<() => Promise<unknown>>(),
  createTemplate: vi.fn<() => Promise<unknown>>(),
  updateTemplate: vi.fn<() => Promise<unknown>>(),
  publishTemplate: vi.fn<() => Promise<unknown>>(),
  archiveTemplate: vi.fn<() => Promise<unknown>>(),
  deleteTemplate: vi.fn<() => Promise<unknown>>(),
}))

function tpl(over: Partial<AdminTemplate>): AdminTemplate {
  return {
    id: 't1',
    slug: 'rustic-hijau',
    name: 'Rustic Hijau',
    access: 'Gratis',
    status: 'Terbit',
    page_count: 9,
    in_use_count: 0,
    updated_at: new Date().toISOString(),
    cover: mockCover('rustic-hijau'),
    ...over,
  }
}

function page(items: AdminTemplate[]): PaginatedResult<AdminTemplate> {
  return {
    data: items,
    meta: { total: items.length, page: 1, limit: 12, total_pages: 1, total_results: items.length },
  }
}

const counts: TemplateCounts = { all: 3, published: 2, draft: 1, archived: 0 }
const ITEMS = [
  tpl({ id: 't1', name: 'Rustic Hijau' }),
  tpl({ id: 't2', name: 'Floral Blush', status: 'Draft', access: 'Premium' }),
  tpl({ id: 't3', name: 'Elegan Putih', in_use_count: 12, access: 'Premium' }),
]

function lastToast() {
  const list = useToast().toasts.value
  return list[list.length - 1]
}

async function mountView(): Promise<VueWrapper> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/demo/:slug', name: 'demo', component: { template: '<div />' } },
      { path: '/admin/template', name: 'admin-templates', component: AdminTemplatesView },
      {
        path: '/admin/template/:id/editor',
        name: 'admin-template-editor',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push('/admin/template')
  await router.isReady()
  const wrapper = mount(AdminTemplatesView, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { teleport: true } },
  })
  await flushPromises()
  return wrapper
}

describe('AdminTemplatesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listTemplates).mockReset().mockResolvedValue(page(ITEMS))
    vi.mocked(getTemplateCounts).mockReset().mockResolvedValue(counts)
    for (const fn of [
      createTemplate,
      updateTemplate,
      publishTemplate,
      archiveTemplate,
      deleteTemplate,
    ]) {
      ;(vi.mocked(fn) as Mock<() => Promise<unknown>>).mockReset().mockResolvedValue(ITEMS[0])
    }
  })

  afterEach(() => {
    const { toasts, dismiss } = useToast()
    toasts.value.forEach((t) => dismiss(t.id))
    vi.useRealTimers()
  })

  it('TC-UI-F3-47: memuat daftar dengan limit server, kartu, badge, dan hitungan filter', async () => {
    const wrapper = await mountView()

    expect(listTemplates).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 12 }))
    expect(wrapper.find('h1').text()).toBe('Template Undangan')
    expect(wrapper.findAll('article.nk-tcard2')).toHaveLength(3)
    expect(wrapper.text()).toContain('Floral Blush')
    expect(wrapper.find('.nk-tag--premium').exists()).toBe(true)
    expect(wrapper.find('.nk-status--warning').text()).toBe('Draft')
    expect(wrapper.find('.nk-chip.is-active').text()).toContain('Semua')
    expect(wrapper.find('.nk-chip__count').text()).toBe('3')
    expect(wrapper.find('.nk-pager__info').text()).toContain('Menampilkan 1–3 dari 3')
    wrapper.unmount()
  })

  it('TC-UI-F3-48: skeleton saat memuat, lalu state kosong pertama dengan ajakan membuat template', async () => {
    let resolve: (v: PaginatedResult<AdminTemplate>) => void = () => {}
    vi.mocked(listTemplates).mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="templates-loading"]').exists()).toBe(true)

    resolve(page([]))
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada template')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Buat template pertama')!
      .trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F3-49: filter status memuat ulang dari halaman 1; hasil kosong karena filter bisa direset', async () => {
    const wrapper = await mountView()
    vi.mocked(listTemplates).mockResolvedValue(page([]))

    await wrapper
      .findAll('.nk-chip')
      .find((c) => c.text().startsWith('Arsip'))!
      .trigger('click')
    await flushPromises()
    expect(listTemplates).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'Arsip', page: 1 }),
    )
    expect(wrapper.text()).toContain('Tidak ada template untuk filter ini')

    vi.mocked(listTemplates).mockResolvedValue(page(ITEMS))
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Reset filter')!
      .trigger('click')
    await flushPromises()
    expect(listTemplates).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined }))
    expect(wrapper.findAll('article.nk-tcard2')).toHaveLength(3)
    wrapper.unmount()
  })

  it('TC-UI-F3-50: pencarian ditunda 300 ms sebelum memanggil server; akses dan urutan ikut dikirim', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    const calls = vi.mocked(listTemplates).mock.calls.length

    await wrapper.find('#template-search').setValue('  sage ')
    await vi.advanceTimersByTimeAsync(200)
    expect(listTemplates).toHaveBeenCalledTimes(calls)
    await vi.advanceTimersByTimeAsync(150)
    await flushPromises()
    expect(listTemplates).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'sage' }))

    await wrapper.find('#template-access').setValue('Premium')
    await wrapper.find('#template-sort').setValue('name_asc')
    await flushPromises()
    expect(listTemplates).toHaveBeenLastCalledWith(
      expect.objectContaining({ access: 'Premium', sort: 'name_asc', q: 'sage' }),
    )
    wrapper.unmount()
  })

  it('TC-UI-F3-51: error menampilkan pesan generik dan coba lagi; 403 menampilkan izin ditolak', async () => {
    vi.mocked(listTemplates).mockRejectedValueOnce(new ApiError(500))
    const wrapper = await mountView()
    expect(wrapper.find('[role="alert"]').text()).toContain('Template belum bisa dimuat')
    expect(wrapper.text()).not.toContain('500')

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('article.nk-tcard2')).toHaveLength(3)
    wrapper.unmount()

    vi.mocked(listTemplates).mockRejectedValue(new ApiError(403))
    const denied = await mountView()
    expect(denied.text()).toContain('Kamu tidak punya akses')
    expect(denied.find('article').exists()).toBe(false)
    denied.unmount()
  })

  it('TC-UI-F3-52: tampilan daftar memakai tabel responsif', async () => {
    const wrapper = await mountView()

    await wrapper.find('button[aria-label="Tampilan daftar"]').trigger('click')

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.find('button[aria-label="Tampilan daftar"]').attributes('aria-pressed')).toBe(
      'true',
    )
    wrapper.unmount()
  })

  it('TC-UI-F3-53: membuat template: tombol nonaktif tanpa nama, sukses menutup dialog, toast, dan memuat ulang', async () => {
    vi.mocked(createTemplate).mockResolvedValue(tpl({ id: 'baru', name: 'Rustic Emas' }))
    const wrapper = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Template baru'))!
      .trigger('click')
    const submit = () => wrapper.find('[role="dialog"] button[type="submit"]')

    expect(submit().attributes('disabled')).toBeDefined()
    await wrapper.find('[role="dialog"] input[type="text"]').setValue('  Rustic Emas ')
    expect(wrapper.find('.nk-field__count').text()).toBe('14/60')
    await wrapper.find('[role="dialog"] input[value="Premium"]').setValue(true)
    const calls = vi.mocked(listTemplates).mock.calls.length
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(createTemplate).toHaveBeenCalledWith({ name: 'Rustic Emas', access: 'Premium' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(lastToast()?.message).toBe('Template “Rustic Emas” dibuat')
    expect(listTemplates).toHaveBeenCalledTimes(calls + 1)
    wrapper.unmount()
  })

  it('TC-UI-F3-54: pembuatan: nama kembar (409) tampil di dialog dan klik ganda hanya mengirim satu request', async () => {
    let reject: (e: unknown) => void = () => {}
    vi.mocked(createTemplate).mockReturnValue(new Promise((_, r) => (reject = r)))
    const wrapper = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Template baru'))!
      .trigger('click')
    await wrapper.find('[role="dialog"] input[type="text"]').setValue('Rustic Hijau')

    await wrapper.find('[role="dialog"] form').trigger('submit')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    expect(createTemplate).toHaveBeenCalledTimes(1)
    expect(
      wrapper.find('[role="dialog"] button[type="submit"]').attributes('disabled'),
    ).toBeDefined()

    reject(new ApiError(409))
    await flushPromises()
    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain('sudah dipakai')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    wrapper.unmount()
  })

  async function openAction(wrapper: VueWrapper, name: string, item: string) {
    await wrapper.find(`button[aria-label="Aksi untuk ${name}"]`).trigger('click')
    const entry = wrapper.findAll('[role="menuitem"]').find((m) => m.text().includes(item))!
    await entry.trigger('click')
    await flushPromises()
  }

  it('TC-UI-F3-55: arsipkan: dialog menyebut jumlah undangan, konfirmasi memanggil API dan memuat ulang', async () => {
    const wrapper = await mountView()

    await openAction(wrapper, 'Elegan Putih', 'Arsipkan')
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.text()).toContain('Arsipkan “Elegan Putih”?')
    expect(dialog.text()).toContain('Dipakai oleh 12 undangan aktif')

    await dialog
      .findAll('button')
      .find((b) => b.text().startsWith('Arsipkan'))!
      .trigger('click')
    await flushPromises()
    expect(archiveTemplate).toHaveBeenCalledWith('t3')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(lastToast()?.message).toContain('diarsipkan')
    wrapper.unmount()
  })

  it('TC-UI-F3-56: arsip gagal menampilkan galat di dialog dan dialog tetap terbuka', async () => {
    vi.mocked(archiveTemplate).mockRejectedValue(new ApiError(500))
    const wrapper = await mountView()

    await openAction(wrapper, 'Rustic Hijau', 'Arsipkan')
    expect(wrapper.find('[role="dialog"]').text()).toContain('Tidak dipakai undangan mana pun')
    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((b) => b.text().startsWith('Arsipkan'))!
      .trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain('Terjadi kendala')
    wrapper.unmount()
  })

  it('TC-UI-F3-57: hapus: harus mengetik nama persis, lalu memanggil API dan toast sukses', async () => {
    const wrapper = await mountView()

    await openAction(wrapper, 'Floral Blush', 'Hapus')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('Hapus “Floral Blush” permanen?')
    expect(dialog().text()).toContain('Tidak dipakai undangan mana pun')
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()

    await dialog().find('input').setValue('Floral Blush')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(deleteTemplate).toHaveBeenCalledWith('t2')
    expect(lastToast()?.message).toBe('Template “Floral Blush” dihapus')
    wrapper.unmount()
  })

  it('TC-UI-F3-58: template yang dipakai undangan tidak bisa dihapus, hanya diarsipkan', async () => {
    const wrapper = await mountView()

    await openAction(wrapper, 'Elegan Putih', 'Hapus')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('Dipakai oleh 12 undangan')
    await dialog().find('input').setValue('Elegan Putih')
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()
    await dialog().find('form').trigger('submit')
    expect(deleteTemplate).not.toHaveBeenCalled()

    await dialog().find('.nk-linkbtn').trigger('click')
    await flushPromises()
    expect(dialog().text()).toContain('Arsipkan “Elegan Putih”?')
    wrapper.unmount()
  })

  it('TC-UI-F3-59: hapus ditolak server (409) menampilkan pesan arsipkan saja', async () => {
    vi.mocked(deleteTemplate).mockRejectedValue(new ApiError(409))
    const wrapper = await mountView()

    await openAction(wrapper, 'Floral Blush', 'Hapus')
    await wrapper.find('[role="dialog"] input').setValue('Floral Blush')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain('hanya bisa diarsipkan')
    wrapper.unmount()
  })

  it('TC-UI-F3-60: terbitkan, pulihkan, dan ubah akses memanggil API yang sesuai dengan toast', async () => {
    const wrapper = await mountView()

    await openAction(wrapper, 'Floral Blush', 'Terbitkan')
    expect(publishTemplate).toHaveBeenCalledWith('t2')
    expect(lastToast()?.message).toBe('Template diterbitkan')

    await openAction(wrapper, 'Rustic Hijau', 'Jadikan Premium')
    expect(updateTemplate).toHaveBeenCalledWith('t1', { access: 'Premium' })
    await openAction(wrapper, 'Floral Blush', 'Jadikan Gratis')
    expect(updateTemplate).toHaveBeenLastCalledWith('t2', { access: 'Gratis' })
    wrapper.unmount()
  })

  it('TC-UI-F3-61: aksi inline gagal menampilkan toast error generik', async () => {
    vi.mocked(publishTemplate).mockRejectedValue(new ApiError(403))
    const wrapper = await mountView()

    await openAction(wrapper, 'Floral Blush', 'Terbitkan')

    const last = lastToast()
    expect(last?.tone).toBe('error')
    expect(last?.message).toBe('Kamu tidak punya akses untuk tindakan ini.')
    wrapper.unmount()
  })

  it('TC-UI-F3-62: menghapus item terakhir di halaman terakhir mundur satu halaman', async () => {
    const second: PaginatedResult<AdminTemplate> = {
      data: [tpl({ id: 'x', name: 'Sisa' })],
      meta: { total: 13, page: 2, limit: 12, total_pages: 2, total_results: 13 },
    }
    vi.mocked(listTemplates).mockResolvedValueOnce({
      data: ITEMS,
      meta: { total: 13, page: 1, limit: 12, total_pages: 2, total_results: 13 },
    })
    const wrapper = await mountView()
    vi.mocked(listTemplates).mockResolvedValueOnce(second)
    await wrapper.find('button[aria-label="Halaman berikutnya"]').trigger('click')
    await flushPromises()
    expect(listTemplates).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))

    vi.mocked(listTemplates).mockResolvedValueOnce(page([])).mockResolvedValue(page(ITEMS))
    await openAction(wrapper, 'Sisa', 'Hapus')
    await wrapper.find('[role="dialog"] input').setValue('Sisa')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(listTemplates).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    wrapper.unmount()
  })
})
