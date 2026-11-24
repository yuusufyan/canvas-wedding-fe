import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminMembershipView from '../AdminMembershipView.vue'
import { ApiError } from '@/api/http'
import { getMembershipSummary, listMemberships } from '@/api/memberships'
import type { Membership, MembershipSummary } from '@/types/admin'
import type { PaginatedResult } from '@/types/api'

vi.mock('@/api/memberships', () => ({
  listMemberships: vi.fn<() => Promise<unknown>>(),
  getMembershipSummary: vi.fn<() => Promise<unknown>>(),
}))

const summary: MembershipSummary = {
  total: 174,
  active: 128,
  trial: 14,
  trial_expiring_soon: 5,
  expiring_soon: 9,
  expired: 23,
}

function member(over: Partial<Membership>): Membership {
  return {
    id: 'm1',
    user_name: 'Nadia Pratama',
    email: 'n***@contoh.test',
    plan: 'Premium',
    status: 'Aktif',
    expires_at: '2027-03-14T00:00:00Z',
    invitations_used: 3,
    invitations_quota: 10,
    ...over,
  }
}

const ROWS = [
  member({}),
  member({
    id: 'm2',
    user_name: 'Dimas Anggara',
    plan: 'Gratis',
    expires_at: null,
    invitations_quota: 1,
  }),
  member({ id: 'm3', user_name: 'Eka Puspita', status: 'Kedaluwarsa', email: 'eka@contoh.test' }),
]

function page(items: Membership[], total = items.length): PaginatedResult<Membership> {
  return { data: items, meta: { total, page: 1, limit: 10, totalPages: 1, totalResults: total } }
}

function stubWidth(wide: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: wide,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }),
  )
}

async function mountView(): Promise<VueWrapper> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/admin/membership', name: 'm', component: AdminMembershipView },
    ],
  })
  await router.push('/admin/membership')
  await router.isReady()
  const wrapper = mount(AdminMembershipView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('AdminMembershipView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    stubWidth(true)
    vi.mocked(listMemberships).mockReset().mockResolvedValue(page(ROWS, 174))
    vi.mocked(getMembershipSummary).mockReset().mockResolvedValue(summary)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('TC-UI-F3-63: ringkasan 4 kartu dengan angka id-ID dan chip filter berhitungan', async () => {
    const wrapper = await mountView()

    const stats = wrapper.findAll('.nk-stat')
    expect(stats.map((s) => s.find('.nk-stat__value').text())).toEqual(['128', '14', '9', '23'])
    expect(stats[1]!.text()).toContain('Berakhir ≤ 7 hari: 5')
    const chips = wrapper.findAll('.nk-chip').map((c) => c.text())
    expect(chips).toEqual([
      'Semua 174',
      'Aktif 128',
      'Trial 14',
      'Segera berakhir 9',
      'Kedaluwarsa 23',
    ])
    wrapper.unmount()
  })

  it('TC-UI-F3-64: tabel menampilkan email tersamar, badge paket dan status, tanggal id-ID, kuota', async () => {
    const wrapper = await mountView()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toContain('n***@contoh.test')
    expect(rows[0]!.text()).toContain('Premium')
    expect(rows[0]!.text()).toContain('14 Mar 2027')
    expect(rows[0]!.text()).toContain('3 / 10')
    expect(rows[1]!.text()).toContain('—')
    // email penuh dari server tetap disamarkan di UI
    expect(rows[2]!.text()).toContain('e***@contoh.test')
    expect(rows[2]!.text()).not.toContain('eka@contoh.test')
    expect(rows[2]!.find('.nk-status--danger').exists()).toBe(true)
    expect(rows[2]!.find('.nk-danger-text').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F3-65: di bawah 768 tabel menjadi daftar kartu', async () => {
    stubWidth(false)
    const wrapper = await mountView()

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.findAll('li.nk-rowcard')).toHaveLength(3)
    expect(wrapper.find('li.nk-rowcard').text()).toContain('Nadia Pratama')
    wrapper.unmount()
  })

  it('TC-UI-F3-66: filter status dan pencarian (ditunda) dikirim ke server, paginasi memakai limit 10', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    expect(listMemberships).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))

    await wrapper
      .findAll('.nk-chip')
      .find((c) => c.text().startsWith('Trial'))!
      .trigger('click')
    await flushPromises()
    expect(listMemberships).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Trial' }))

    await wrapper.find('#membership-search').setValue('nadia')
    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()
    expect(listMemberships).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'Trial', q: 'nadia', page: 1 }),
    )

    await wrapper.find('button[aria-label="Halaman 2"]').trigger('click')
    await flushPromises()
    expect(listMemberships).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    wrapper.unmount()
  })

  it('TC-UI-F3-67: skeleton, kosong pertama, kosong karena filter, error, dan 403', async () => {
    let resolve: (v: PaginatedResult<Membership>) => void = () => {}
    vi.mocked(listMemberships).mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="membership-loading"]').exists()).toBe(true)

    resolve(page([]))
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada member')

    vi.mocked(listMemberships).mockResolvedValue(page([]))
    await wrapper
      .findAll('.nk-chip')
      .find((c) => c.text().startsWith('Aktif'))!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Tidak ada member untuk filter ini')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Reset filter')!
      .trigger('click')
    wrapper.unmount()

    vi.mocked(listMemberships)
      .mockReset()
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValue(page(ROWS))
    const failed = await mountView()
    expect(failed.find('[role="alert"]').text()).toContain('Data membership belum bisa dimuat')
    await failed.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(failed.findAll('tbody tr')).toHaveLength(3)
    failed.unmount()

    vi.mocked(listMemberships).mockReset().mockRejectedValue(new ApiError(403))
    const denied = await mountView()
    expect(denied.text()).toContain('Kamu tidak punya akses')
    denied.unmount()
  })

  it('TC-UI-F3-68: ringkasan gagal dimuat menampilkan pesan dan bisa dicoba lagi', async () => {
    vi.mocked(getMembershipSummary)
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValue(summary)
    const wrapper = await mountView()
    expect(wrapper.find('section [role="alert"]').text()).toContain('Ringkasan belum bisa dimuat')

    await wrapper.find('section [role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.nk-stat')).toHaveLength(4)
    wrapper.unmount()
  })
})
