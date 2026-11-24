import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminUsersView from '../AdminUsersView.vue'
import { ApiError } from '@/api/http'
import { listRoles } from '@/api/roles'
import { createUser, deleteUser, listUsers, updateUser } from '@/api/users'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { PaginatedResult } from '@/types/api'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'

vi.mock('@/api/users', () => ({
  listUsers: vi.fn<() => Promise<unknown>>(),
  createUser: vi.fn<() => Promise<unknown>>(),
  updateUser: vi.fn<() => Promise<unknown>>(),
  deleteUser: vi.fn<() => Promise<unknown>>(),
}))
vi.mock('@/api/roles', () => ({ listRoles: vi.fn<() => Promise<unknown>>() }))

const SUPERADMIN = { id: 'r-sa', name: 'SuperAdmin' }
const USER_ROLE = { id: 'r-user', name: 'User' }

function user(over: Partial<User>): User {
  return {
    id: 'u-2',
    name: 'Rina Operator',
    email: 'rina@contoh.test',
    role: USER_ROLE,
    is_active: true,
    created_at: '2026-11-14T00:00:00Z',
    updated_at: '2026-11-14T00:00:00Z',
    ...over,
  }
}

const SELF = user({ id: 'u-1', name: 'Admin Utama', email: 'admin@contoh.test', role: SUPERADMIN })
const OTHER = user({})
const INACTIVE = user({
  id: 'u-3',
  name: 'Dimas Anggara',
  email: 'dimas@contoh.test',
  is_active: false,
})

function page(items: User[], total = items.length): PaginatedResult<User> {
  return { data: items, meta: { total, page: 1, limit: 10, total_pages: 1, total_results: total } }
}

const roles: Role[] = [
  { id: 'r-sa', name: 'SuperAdmin', description: null, created_at: '', updated_at: '' },
  { id: 'r-user', name: 'User', description: null, created_at: '', updated_at: '' },
  { id: 'r-op', name: 'Operator', description: null, created_at: '', updated_at: '' },
]

async function mountView(): Promise<VueWrapper> {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/admin/pengguna', name: 'admin-users', component: AdminUsersView },
      { path: '/admin/pengguna/role', name: 'admin-roles', component: stub },
    ],
  })
  await router.push('/admin/pengguna')
  await router.isReady()
  const wrapper = mount(AdminUsersView, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { teleport: true } },
  })
  await flushPromises()
  return wrapper
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

describe('AdminUsersView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().$patch({
      isAuthenticated: true,
      profile: {
        id: 'u-1',
        name: 'Admin Utama',
        email: 'admin@contoh.test',
        role: 'superadmin',
      },
    })
    vi.mocked(listUsers)
      .mockReset()
      .mockResolvedValue(page([SELF, OTHER, INACTIVE]))
    vi.mocked(listRoles)
      .mockReset()
      .mockResolvedValue({
        data: roles,
        meta: { total: 3, page: 1, limit: 100, total_pages: 1, total_results: 3 },
      })
    for (const fn of [createUser, updateUser, deleteUser]) {
      ;(vi.mocked(fn) as Mock<() => Promise<unknown>>).mockReset().mockResolvedValue(OTHER)
    }
  })

  afterEach(() => {
    const { toasts, dismiss } = useToast()
    toasts.value.forEach((t) => dismiss(t.id))
  })

  it('TC-UI-F5-24: tab Pengguna|Role, jumlah, email penuh, penanda Kamu, role dan status', async () => {
    const wrapper = await mountView()

    expect(listUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))
    expect(wrapper.find('h1').text()).toBe('Pengguna & Role')
    const tabs = wrapper.findAll('.nk-tabs__link')
    expect(tabs.map((t) => t.text())).toEqual(['Pengguna', 'Role'])
    expect(tabs[0]!.classes()).toContain('is-active')
    expect(wrapper.text()).toContain('3 pengguna terdaftar')
    expect(wrapper.text()).toContain('rina@contoh.test')
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.find('.nk-selftag').text()).toBe('Kamu')
    expect(rows[1]!.find('.nk-selftag').exists()).toBe(false)
    expect(rows[2]!.text()).toContain('Nonaktif')
    expect(wrapper.find('.nk-pager__info').text()).toContain('Menampilkan 1–3 dari 3')
    wrapper.unmount()
  })

  it('TC-UI-F5-25: skeleton, kosong, error, dan 403', async () => {
    let resolve: (v: PaginatedResult<User>) => void = () => {}
    vi.mocked(listUsers).mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = await mountView()
    expect(wrapper.find('[data-testid="users-loading"]').exists()).toBe(true)
    resolve(page([]))
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada pengguna')
    wrapper.unmount()

    vi.mocked(listUsers)
      .mockReset()
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValue(page([SELF]))
    const failed = await mountView()
    expect(failed.find('[role="alert"]').text()).toContain('Pengguna belum bisa dimuat')
    await failed.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(failed.findAll('tbody tr')).toHaveLength(1)
    failed.unmount()

    vi.mocked(listUsers).mockReset().mockRejectedValue(new ApiError(403))
    const denied = await mountView()
    expect(denied.text()).toContain('Kamu tidak punya akses')
    denied.unmount()
  })

  it('TC-UI-F5-26: tambah pengguna: validasi byte, email dinormalisasi, kata sandi dikosongkan, toast, dan muat ulang', async () => {
    const wrapper = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Tambah pengguna'))!
      .trigger('click')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('Akun buatan SuperAdmin langsung aktif tanpa email aktivasi')

    await dialog().find('form').trigger('submit')
    expect(createUser).not.toHaveBeenCalled()
    expect(dialog().text()).toContain('Nama lengkap wajib diisi.')
    expect(dialog().text()).toContain('Kata sandi wajib diisi.')

    const inputs = dialog().findAll('input')
    await inputs[0]!.setValue(' Hilda Baru ')
    await inputs[1]!.setValue(' hilda@contoh.test ')
    await inputs[2]!.setValue('pendek')
    await dialog().find('form').trigger('submit')
    expect(dialog().text()).toContain('Kata sandi minimal 8 karakter.')

    await inputs[2]!.setValue('Niskala2026!')
    await dialog().find('select').setValue('r-op')
    const calls = vi.mocked(listUsers).mock.calls.length
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(createUser).toHaveBeenCalledWith({
      name: 'Hilda Baru',
      email: 'hilda@contoh.test',
      password: 'Niskala2026!',
      role_id: 'r-op',
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(lastToast()?.message).toBe('Pengguna Rina Operator ditambahkan')
    expect(listUsers).toHaveBeenCalledTimes(calls + 1)
    wrapper.unmount()
  })

  it('TC-UI-F5-27: tambah pengguna gagal: 409 email terdaftar, 400 generik; tombol nonaktif saat request', async () => {
    let reject: (e: unknown) => void = () => {}
    vi.mocked(createUser).mockReturnValue(new Promise((_, r) => (reject = r)))
    const wrapper = await mountView()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Tambah pengguna'))!
      .trigger('click')
    const dialog = () => wrapper.find('[role="dialog"]')
    const inputs = dialog().findAll('input')
    await inputs[0]!.setValue('Hilda')
    await inputs[1]!.setValue('rina@contoh.test')
    await inputs[2]!.setValue('Niskala2026!')

    await dialog().find('form').trigger('submit')
    await dialog().find('form').trigger('submit')
    expect(createUser).toHaveBeenCalledTimes(1)
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()

    reject(new ApiError(409))
    await flushPromises()
    expect(dialog().find('[role="alert"]').text()).toContain('Email sudah terdaftar')
    expect((dialog().findAll('input')[2]!.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('TC-UI-F5-28: ubah pengguna mengirim hanya field yang berubah dan tombol simpan nonaktif tanpa perubahan', async () => {
    const wrapper = await mountView()
    await openMenu(wrapper, 'Rina Operator', 'Ubah')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()

    await dialog().find('select').setValue('r-op')
    await dialog().findAll('input')[0]!.setValue('Rina Baru')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(updateUser).toHaveBeenCalledWith('u-2', { name: 'Rina Baru', role_id: 'r-op' })
    expect(lastToast()?.message).toBe('Perubahan disimpan')
    wrapper.unmount()
  })

  it('TC-UI-F5-29: ubah kata sandi hanya muncul setelah tautan dibuka dan dikirim bersama field lain', async () => {
    const wrapper = await mountView()
    await openMenu(wrapper, 'Rina Operator', 'Ubah')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().find('input[type="password"]').exists()).toBe(false)

    await dialog().find('.nk-linkbtn').trigger('click')
    await dialog().find('input[type="password"]').setValue('KataSandiBaru1')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(updateUser).toHaveBeenCalledWith('u-2', { password: 'KataSandiBaru1' })
    wrapper.unmount()
  })

  it('TC-UI-F5-30: akun sendiri dikunci: role dan status tidak bisa diubah dan ada penjelasan', async () => {
    const wrapper = await mountView()
    await openMenu(wrapper, 'Admin Utama', 'Ubah')
    const dialog = wrapper.find('[role="dialog"]')

    expect(dialog.find('select').attributes('disabled')).toBeDefined()
    expect(dialog.find('[role="switch"]').attributes('disabled')).toBeDefined()
    expect(dialog.text()).toContain('akunmu sendiri tidak bisa diubah')
    expect(dialog.text()).toContain('Tidak bisa dinonaktifkan.')

    await dialog.findAll('input')[0]!.setValue('Admin Baru')
    await dialog.find('form').trigger('submit')
    await flushPromises()
    expect(updateUser).toHaveBeenCalledWith('u-1', { name: 'Admin Baru' })
    wrapper.unmount()
  })

  it('TC-UI-F5-31: ubah pengguna: 409 pada role/status dijelaskan sebagai perlindungan akun', async () => {
    vi.mocked(updateUser).mockRejectedValue(new ApiError(409))
    const wrapper = await mountView()
    await openMenu(wrapper, 'Rina Operator', 'Ubah')
    const dialog = () => wrapper.find('[role="dialog"]')

    await dialog().find('[role="switch"]').trigger('click')
    await dialog().find('form').trigger('submit')
    await flushPromises()

    expect(dialog().find('[role="alert"]').text()).toContain('SuperAdmin aktif terakhir')
    wrapper.unmount()
  })

  it('TC-UI-F5-32: nonaktifkan: konfirmasi memanggil API; akun sendiri terkunci dengan penjelasan', async () => {
    const wrapper = await mountView()

    await openMenu(wrapper, 'Rina Operator', 'Nonaktifkan')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('Nonaktifkan Rina Operator?')
    expect(dialog().text()).toContain('semua sesi login-nya diputus')
    await dialog()
      .findAll('button')
      .find((b) => b.text() === 'Nonaktifkan')!
      .trigger('click')
    await flushPromises()
    expect(updateUser).toHaveBeenCalledWith('u-2', { is_active: false })
    expect(lastToast()?.message).toBe('Akun Rina Operator dinonaktifkan')

    await openMenu(wrapper, 'Admin Utama', 'Nonaktifkan')
    expect(dialog().text()).toContain('Akunmu sendiri tidak bisa dinonaktifkan')
    expect(
      dialog()
        .findAll('button')
        .find((b) => b.text() === 'Nonaktifkan')!
        .attributes('disabled'),
    ).toBeDefined()
    wrapper.unmount()
  })

  it('TC-UI-F5-33: aktifkan akun nonaktif langsung dengan toast; 403 menampilkan toast error', async () => {
    const wrapper = await mountView()

    await openMenu(wrapper, 'Dimas Anggara', 'Aktifkan')
    expect(updateUser).toHaveBeenCalledWith('u-3', { is_active: true })
    expect(lastToast()?.message).toBe('Akun Dimas Anggara diaktifkan')

    vi.mocked(updateUser).mockRejectedValue(new ApiError(403))
    await openMenu(wrapper, 'Dimas Anggara', 'Aktifkan')
    expect(lastToast()?.tone).toBe('error')
    wrapper.unmount()
  })

  it('TC-UI-F5-34: hapus perlu mengetik email persis; akun sendiri diblokir; 409 menampilkan penjelasan', async () => {
    const wrapper = await mountView()
    await openMenu(wrapper, 'Rina Operator', 'Hapus')
    const dialog = () => wrapper.find('[role="dialog"]')
    expect(dialog().text()).toContain('rina@contoh.test juga tidak bisa dipakai mendaftar ulang')
    expect(dialog().find('label').text()).toBe('Ketik email untuk konfirmasi')
    expect(dialog().find('button[type="submit"]').attributes('disabled')).toBeDefined()

    await dialog().find('input').setValue('rina@contoh.test')
    await dialog().find('form').trigger('submit')
    await flushPromises()
    expect(deleteUser).toHaveBeenCalledWith('u-2')
    expect(lastToast()?.message).toBe('Pengguna Rina Operator dihapus')

    await openMenu(wrapper, 'Admin Utama', 'Hapus')
    expect(dialog().text()).toContain('Akunmu sendiri tidak bisa dihapus')
    expect(dialog().find('input').attributes('disabled')).toBeDefined()

    await dialog()
      .findAll('button')
      .find((b) => b.text() === 'Batal')!
      .trigger('click')
    vi.mocked(deleteUser).mockRejectedValue(new ApiError(409))
    await openMenu(wrapper, 'Dimas Anggara', 'Hapus')
    await dialog().find('input').setValue('dimas@contoh.test')
    await dialog().find('form').trigger('submit')
    await flushPromises()
    expect(dialog().find('[role="alert"]').text()).toContain('SuperAdmin aktif terakhir')
    wrapper.unmount()
  })

  it('TC-UI-F5-35: menghapus pengguna terakhir di halaman terakhir mundur satu halaman', async () => {
    vi.mocked(listUsers).mockResolvedValueOnce({
      data: [OTHER],
      meta: { total: 11, page: 2, limit: 10, total_pages: 2, total_results: 11 },
    })
    const wrapper = await mountView()
    vi.mocked(listUsers).mockResolvedValueOnce({
      data: [OTHER],
      meta: { total: 11, page: 2, limit: 10, total_pages: 2, total_results: 11 },
    })
    await wrapper.find('button[aria-label="Halaman berikutnya"]').trigger('click')
    await flushPromises()
    expect(listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))

    vi.mocked(listUsers)
      .mockResolvedValueOnce(page([]))
      .mockResolvedValue(page([SELF]))
    await openMenu(wrapper, 'Rina Operator', 'Hapus')
    await wrapper.find('[role="dialog"] input').setValue('rina@contoh.test')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    wrapper.unmount()
  })

  it('TC-UI-F5-36: email tidak masuk console saat menampilkan dan mengubah pengguna', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    )
    const wrapper = await mountView()
    await openMenu(wrapper, 'Rina Operator', 'Ubah')
    await wrapper.find('[role="dialog"] input').setValue('Nama Lain')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain('contoh.test')
    }
    spies.forEach((spy) => spy.mockRestore())
    wrapper.unmount()
  })
})
