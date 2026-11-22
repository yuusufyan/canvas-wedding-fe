import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminDashboardView from '../AdminDashboardView.vue'
import {
  getInvitationStats,
  getRecentActivity,
  getRegistrationTrend,
  getTopTemplates,
} from '@/api/dashboard'
import { ApiError } from '@/api/http'
import { getMembershipSummary, listMemberships } from '@/api/memberships'
import { getTemplateCounts } from '@/api/templates'
import { listUsers } from '@/api/users'

vi.mock('@/api/dashboard', () => ({
  getInvitationStats: vi.fn<() => Promise<unknown>>(),
  getRegistrationTrend: vi.fn<() => Promise<unknown>>(),
  getTopTemplates: vi.fn<() => Promise<unknown>>(),
  getRecentActivity: vi.fn<() => Promise<unknown>>(),
}))
vi.mock('@/api/memberships', () => ({
  getMembershipSummary: vi.fn<() => Promise<unknown>>(),
  listMemberships: vi.fn<() => Promise<unknown>>(),
}))
vi.mock('@/api/templates', () => ({ getTemplateCounts: vi.fn<() => Promise<unknown>>() }))
vi.mock('@/api/users', () => ({ listUsers: vi.fn<() => Promise<unknown>>() }))

const meta = (total: number) => ({ total, page: 1, limit: 1, total_pages: 1, total_results: total })

function arrange() {
  vi.mocked(listUsers)
    .mockReset()
    .mockResolvedValue({ data: [], meta: meta(41) })
  vi.mocked(getTemplateCounts)
    .mockReset()
    .mockResolvedValue({ all: 8, published: 5, draft: 2, archived: 1 })
  vi.mocked(getInvitationStats)
    .mockReset()
    .mockResolvedValue({ invitations_active: 128, invitations_new_30d: 19 })
  vi.mocked(getMembershipSummary).mockReset().mockResolvedValue({
    total: 174,
    active: 1280,
    trial: 14,
    trial_expiring_soon: 5,
    expiring_soon: 9,
    expired: 23,
  })
  vi.mocked(getRegistrationTrend)
    .mockReset()
    .mockResolvedValue([
      { label: 'Okt 19', count: 2 },
      { label: 'Okt 26', count: 5 },
      { label: 'Nov 2', count: 3 },
    ])
  vi.mocked(getTopTemplates)
    .mockReset()
    .mockResolvedValue([
      { name: 'Rustic Hijau', invitations: 58 },
      { name: 'Elegan Putih', invitations: 29 },
    ])
  vi.mocked(listMemberships)
    .mockReset()
    .mockResolvedValue({
      data: [
        {
          id: 'm1',
          user_name: 'Bagas Wicaksono',
          email: 'bagas@contoh.test',
          plan: 'Premium',
          status: 'Segera berakhir',
          expires_at: '2026-11-24T00:00:00Z',
          invitations_used: 1,
          invitations_quota: 10,
        },
      ],
      meta: meta(1),
    })
  vi.mocked(getRecentActivity)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'e1',
        kind: 'login_failed',
        message: '3 login gagal beruntun dari satu IP',
        occurred_at: new Date().toISOString(),
      },
      {
        id: 'e2',
        kind: 'user_created',
        message: 'Pengguna baru: Gita Maharani',
        occurred_at: new Date().toISOString(),
      },
    ])
}

async function mountView() {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/admin', name: 'home', component: AdminDashboardView },
      { path: '/admin/template', name: 'admin-templates', component: stub },
      { path: '/admin/membership', name: 'admin-membership', component: stub },
    ],
  })
  await router.push('/admin')
  await router.isReady()
  const wrapper = mount(AdminDashboardView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('AdminDashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    arrange()
  })

  it('TC-UI-F5-55: empat kartu ringkasan memakai data nyata pengguna dan modul yang ada, angka id-ID', async () => {
    const wrapper = await mountView()

    const stats = wrapper.findAll('.nk-dashstat')
    expect(stats.map((s) => s.find('.nk-stat__value').text())).toEqual(['41', '5', '128', '1.280'])
    expect(listUsers).toHaveBeenCalledWith({ page: 1, limit: 1 })
    expect(stats[1]!.text()).toContain('2 draft · 1 arsip')
    expect(stats[2]!.text()).toContain('+19 dalam 30 hari')
    expect(stats[3]!.text()).toContain('9 berakhir ≤ 7 hari')
    expect(wrapper.find('h1').text()).toBe('Dashboard')
    expect(wrapper.text()).toContain('Ringkasan sistem ·')
    wrapper.unmount()
  })

  it('TC-UI-F5-56: grafik batang pendaftaran dengan puncak berbeda dan total; template terpopuler berskala', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.nk-card__total').text()).toBe('Total 10')
    const bars = wrapper.findAll('.nk-bars__bar')
    expect(bars.map((b) => b.attributes('style'))).toEqual([
      'height: 40%;',
      'height: 100%;',
      'height: 60%;',
    ])
    expect(bars[1]!.classes()).toContain('is-peak')
    expect(bars[0]!.classes()).not.toContain('is-peak')
    const fills = wrapper.findAll('.nk-hbars__fill').map((f) => f.attributes('style'))
    expect(fills).toEqual(['width: 100%;', 'width: 50%;'])
    expect(wrapper.text()).toContain('58 undangan')
    wrapper.unmount()
  })

  it('TC-UI-F5-57: membership segera berakhir dengan email tersamar dan tanggal; aktivitas dengan waktu relatif tanpa IP', async () => {
    const wrapper = await mountView()

    expect(listMemberships).toHaveBeenCalledWith({ page: 1, limit: 3, status: 'Segera berakhir' })
    expect(wrapper.text()).toContain('b***@contoh.test')
    expect(wrapper.text()).not.toContain('bagas@contoh.test')
    expect(wrapper.text()).toContain('24 Nov 2026')
    expect(wrapper.text()).toContain('3 login gagal beruntun dari satu IP')
    expect(wrapper.text()).toContain('baru saja')
    expect(wrapper.find('a[href="/admin/membership"]').text()).toBe('Lihat semua')
    expect(wrapper.find('a[href="/admin/template"]').text()).toBe('Lihat semua')
    wrapper.unmount()
  })

  it('TC-UI-F5-58: satu kartu gagal tidak merusak yang lain dan bisa dicoba lagi', async () => {
    vi.mocked(getTopTemplates).mockRejectedValueOnce(new ApiError(500))
    vi.mocked(getInvitationStats).mockRejectedValueOnce(new ApiError(500))
    const wrapper = await mountView()

    const alerts = wrapper.findAll('[role="alert"]')
    expect(alerts).toHaveLength(2)
    expect(wrapper.text()).toContain('Template terpopuler belum bisa dimuat.')
    expect(wrapper.findAll('.nk-bars__bar')).toHaveLength(3)

    await wrapper.findAll('[role="alert"] button')[0]!.trigger('click')
    await wrapper.findAll('[role="alert"] button')[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('58 undangan')
    wrapper.unmount()
  })

  it('TC-UI-F5-59: skeleton saat memuat dan state kosong per kartu', async () => {
    let resolve: (v: unknown) => void = () => {}
    vi.mocked(getRegistrationTrend).mockReturnValue(new Promise((r) => (resolve = r)) as never)
    vi.mocked(getRecentActivity).mockResolvedValue([])
    vi.mocked(getTopTemplates).mockResolvedValue([])
    vi.mocked(listMemberships).mockResolvedValue({ data: [], meta: meta(0) })
    const wrapper = await mountView()

    expect(wrapper.find('.nk-dashcard__skeleton').exists()).toBe(true)
    expect(wrapper.find('.nk-dashcard__skeleton').text()).toContain('Memuat Pendaftaran pengguna')
    expect(wrapper.text()).toContain('Belum ada aktivitas.')
    expect(wrapper.text()).toContain('Belum ada template yang dipakai.')
    expect(wrapper.text()).toContain('Tidak ada membership yang segera berakhir.')

    resolve([])
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada pendaftaran.')
    wrapper.unmount()
  })

  it('TC-UI-F5-60: 403 pada satu kartu menampilkan pesan tanpa tombol coba lagi', async () => {
    vi.mocked(listUsers).mockRejectedValue(new ApiError(403))
    const wrapper = await mountView()

    const stat = wrapper.findAll('.nk-dashstat')[0]!
    expect(stat.text()).toContain('Tidak ada akses.')
    expect(stat.find('button').exists()).toBe(false)
    wrapper.unmount()
  })
})
