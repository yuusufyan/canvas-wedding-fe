import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import AdminRolesView from '../AdminRolesView.vue'
import { ApiError } from '@/api/http'
import { createRole, deleteRole, listRoles, updateRole } from '@/api/roles'
import { listUsers } from '@/api/users'
import { useToast } from '@/composables/useToast'
import type { PaginatedResult } from '@/types/api'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'

vi.mock('@/api/roles', () => ({
  listRoles: vi.fn<() => Promise<unknown>>(),
  createRole: vi.fn<() => Promise<unknown>>(),
  updateRole: vi.fn<() => Promise<unknown>>(),
  deleteRole: vi.fn<() => Promise<unknown>>(),
}))
vi.mock('@/api/users', () => ({ listUsers: vi.fn<() => Promise<unknown>>() }))

function role(id: string, name: string, description: string | null = null): Role {
  return { id, name, description, created_at: '', updated_at: '' }
}

const ROLES = [
  role('r-sa', 'SuperAdmin', 'Akses penuh ke seluruh sistem.'),
  role('r-user', 'User', 'Pelanggan.'),
  role('r-op', 'Operator', 'Mengelola template dan undangan.'),
]

function rolesPage(items: Role[]): PaginatedResult<Role> {
  return {
    data: items,
    meta: { total: items.length, page: 1, limit: 10, total_pages: 1, total_results: items.length },
  }
}

function person(id: string, name: string, roleId: string): User {
  return {
    id,
    name,
    email: `${name.toLowerCase()}@contoh.test`,
    role: { id: roleId, name: roleId },
    is_active: true,
    created_at: '',
    updated_at: '',
  }
}

async function mountView(): Promise<{ wrapper: VueWrapper; router: Router }> {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/admin/pengguna', name: 'admin-users', component: stub },
      { path: '/admin/pengguna/role', name: 'admin-roles', component: AdminRolesView },
      { path: '/admin/pengguna/role/:id', name: 'admin-role-access', component: stub },
    ],
  })
  await router.push('/admin/pengguna/role')
  await router.isReady()
  const wrapper = mount(AdminRolesView, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { teleport: true } },
  })
  await flushPromises()
  return { wrapper, router }
}

function lastToast() {
  const list = useToast().toasts.value
  return list[list.length - 1]
}

async function openMenu(wrapper: VueWrapper, name: string, item: string) {
  await wrapper.find(`button[aria-label="Aksi untuk ${name}"]`).trigger('click')
  await wrapper
    .findAll('[role="menuitem"]')
    .find((m) => m.text() === item)!
    .trigger('click')
  await flushPromises()
}

describe('AdminRolesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listRoles).mockReset().mockResolvedValue(rolesPage(ROLES))
    vi.mocked(createRole).mockReset().mockResolvedValue(role('r-new', 'Tamu Khusus'))
    vi.mocked(updateRole).mockReset().mockResolvedValue(ROLES[2]!)
    vi.mocked(deleteRole).mockReset().mockResolvedValue(null)
    vi.mocked(listUsers)
      .mockReset()
      .mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 100, total_pages: 0, total_results: 0 },
      })
  })

  afterEach(() => {
    const { toasts, dismiss } = useToast()
    toasts.value.forEach((t) => dismiss(t.id))
  })

  it('TC-UI-F5-37: daftar role: jenis Sistem/Kustom, tab Role aktif, ringkasan jumlah', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('.nk-tabs__link')[1]!.classes()).toContain('is-active')
    expect(wrapper.text()).toContain('3 role · 2 role sistem tidak bisa diubah atau dihapus')
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toContain('Sistem')
    expect(rows[2]!.text()).toContain('Kustom')
    wrapper.unmount()
  })

  it('TC-UI-F5-38: role sistem tanpa ubah/hapus; SuperAdmin hanya Lihat, User dan kustom Atur izin & menu', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('button[aria-label="Aksi untuk SuperAdmin"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Aksi untuk User"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Aksi untuk Operator"]').exists()).toBe(true)

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0]!.find('a').text()).toBe('Lihat')
    expect(rows[1]!.find('a').text()).toBe('Atur izin & menu')
    expect(rows[2]!.find('a').attributes('href')).toBe('/admin/pengguna/role/r-op')
    wrapper.unmount()
  })

  it('TC-UI-F5-39: skeleton, kosong, error dengan coba lagi, dan 403', async () => {
    let resolve: (v: PaginatedResult<Role>) => void = () => {}
    vi.mocked(listRoles).mockReturnValue(new Promise((r) => (resolve = r)))
    const first = await mountView()
    expect(first.wrapper.find('[data-testid="roles-loading"]').exists()).toBe(true)
    resolve(rolesPage([]))
    await flushPromises()
    expect(first.wrapper.text()).toContain('Belum ada role')
    first.wrapper.unmount()

    vi.mocked(listRoles)
      .mockReset()
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValue(rolesPage(ROLES))
    const failed = await mountView()
    expect(failed.wrapper.find('[role="alert"]').text()).toContain('Role belum bisa dimuat')
    await failed.wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(failed.wrapper.findAll('tbody tr')).toHaveLength(3)
    failed.wrapper.unmount()

    vi.mocked(listRoles).mockReset().mockRejectedValue(new ApiError(403))
    const denied = await mountView()
    expect(denied.wrapper.text()).toContain('Kamu tidak punya akses')
    denied.wrapper.unmount()
  })

  it('TC-UI-F5-40: tambah role: validasi nama 3-50 dan pola, lalu diarahkan ke atur izin & menu', async () => {
    const { wrapper, router } = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Tambah role'))!
      .trigger('click')
    const dialog = () => wrapper.find('[role="dialog"]')

    await dialog().find('input').setValue('ab')
    await dialog().find('form').trigger('submit')
    expect(dialog().text()).toContain('Nama role 3–50 karakter.')
    await dialog().find('input').setValue('Tamu!')
    await dialog().find('form').trigger('submit')
    expect(dialog().text()).toContain('hanya boleh huruf, angka')
    expect(createRole).not.toHaveBeenCalled()

    await dialog().find('input').setValue(' Tamu Khusus ')
    await dialog().find('textarea').setValue('Untuk tamu VIP')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(createRole).toHaveBeenCalledWith({ name: 'Tamu Khusus', description: 'Untuk tamu VIP' })
    expect(lastToast()?.message).toBe('Role Tamu Khusus dibuat')
    expect(router.currentRoute.value.fullPath).toBe('/admin/pengguna/role/r-new')
    wrapper.unmount()
  })

  it('TC-UI-F5-41: tambah role: nama kembar (409) dan galat lain ditampilkan generik', async () => {
    vi.mocked(createRole)
      .mockRejectedValueOnce(new ApiError(409))
      .mockRejectedValueOnce(new ApiError(500))
    const { wrapper } = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Tambah role'))!
      .trigger('click')
    const dialog = () => wrapper.find('[role="dialog"]')
    await dialog().find('input').setValue('Operator')

    await dialog().find('form').trigger('submit')
    await flushPromises()
    expect(dialog().find('[role="alert"]').text()).toContain('Nama role sudah dipakai')

    await dialog().find('form').trigger('submit')
    await flushPromises()
    expect(dialog().find('[role="alert"]').text()).toContain('Terjadi kendala')
    wrapper.unmount()
  })

  it('TC-UI-F5-42: ubah role kustom mengirim hanya field yang berubah', async () => {
    const { wrapper } = await mountView()
    await openMenu(wrapper, 'Operator', 'Ubah')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()

    await dialog().find('textarea').setValue('Deskripsi baru')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(updateRole).toHaveBeenCalledWith('r-op', { description: 'Deskripsi baru' })
    expect(lastToast()?.message).toBe('Perubahan disimpan')
    wrapper.unmount()
  })

  it('TC-UI-F5-43: hapus role kustom: konfirmasi, API, toast; galat generik tetap di dialog', async () => {
    const { wrapper } = await mountView()
    await openMenu(wrapper, 'Operator', 'Hapus')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('Hapus role Operator?')

    vi.mocked(deleteRole).mockRejectedValueOnce(new ApiError(500))
    await dialog()
      .findAll('button')
      .find((b) => b.text() === 'Hapus role')!
      .trigger('click')
    await flushPromises()
    expect(dialog().find('[role="alert"]').text()).toContain('Terjadi kendala')

    await dialog()
      .findAll('button')
      .find((b) => b.text() === 'Hapus role')!
      .trigger('click')
    await flushPromises()
    expect(deleteRole).toHaveBeenLastCalledWith('r-op')
    expect(lastToast()?.message).toBe('Role Operator dihapus')
    wrapper.unmount()
  })

  it('TC-UI-F5-44: role yang masih dipakai (409) menampilkan daftar pengguna dan tautan ke Pengguna', async () => {
    vi.mocked(deleteRole).mockRejectedValue(new ApiError(409))
    vi.mocked(listUsers).mockResolvedValue({
      data: [
        person('1', 'Rina', 'r-op'),
        person('2', 'Budi', 'r-user'),
        person('3', 'Sari', 'r-op'),
      ],
      meta: { total: 3, page: 1, limit: 100, total_pages: 1, total_results: 3 },
    })
    const { wrapper } = await mountView()

    await openMenu(wrapper, 'Operator', 'Hapus')
    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((b) => b.text() === 'Hapus role')!
      .trigger('click')
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.text()).toContain('Role Operator belum bisa dihapus')
    expect(listUsers).toHaveBeenCalledWith({ page: 1, limit: 100 })
    const names = dialog.findAll('.nk-userlist li').map((li) => li.find('strong').text())
    expect(names).toEqual(['Rina', 'Sari'])
    expect(dialog.text()).toContain('rina@contoh.test')
    expect(dialog.find('a[href="/admin/pengguna"]').text()).toContain('Lihat pengguna')
    expect(dialog.text()).not.toContain('akun pertama')
    wrapper.unmount()
  })

  it('TC-UI-F5-45: pemindaian pengguna hanya sebagian (>100) diberi catatan; gagal memuat tetap menjelaskan', async () => {
    vi.mocked(deleteRole).mockRejectedValue(new ApiError(409))
    vi.mocked(listUsers).mockResolvedValue({
      data: [person('1', 'Rina', 'r-op')],
      meta: { total: 150, page: 1, limit: 100, total_pages: 2, total_results: 150 },
    })
    const { wrapper } = await mountView()
    await openMenu(wrapper, 'Operator', 'Hapus')
    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((b) => b.text() === 'Hapus role')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').text()).toContain('akun pertama')

    vi.mocked(listUsers).mockRejectedValue(new ApiError(500))
    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((b) => b.text() === 'Tutup')!
      .trigger('click')
    await openMenu(wrapper, 'Operator', 'Hapus')
    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((b) => b.text() === 'Hapus role')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').text()).toContain(
      'Daftar pengguna belum bisa ditampilkan',
    )
    wrapper.unmount()
  })
})
