import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminRoleAccessView from '../AdminRoleAccessView.vue'
import {
  getRoleMenus,
  getRolePermissions,
  listCatalogMenus,
  listPermissions,
  setRoleMenus,
  setRolePermissions,
} from '@/api/access'
import { ApiError } from '@/api/http'
import { getRole } from '@/api/roles'
import { useToast } from '@/composables/useToast'
import type { Role } from '@/types/role'

vi.mock('@/api/access', () => ({
  listPermissions: vi.fn<() => Promise<unknown>>(),
  listCatalogMenus: vi.fn<() => Promise<unknown>>(),
  getRolePermissions: vi.fn<() => Promise<unknown>>(),
  getRoleMenus: vi.fn<() => Promise<unknown>>(),
  setRolePermissions: vi.fn<() => Promise<unknown>>(),
  setRoleMenus: vi.fn<() => Promise<unknown>>(),
}))
vi.mock('@/api/roles', () => ({ getRole: vi.fn<() => Promise<unknown>>() }))

const meta = { total: 0, page: 1, limit: 100, total_pages: 1, total_results: 0 }

function role(id: string, name: string): Role {
  return { id, name, description: 'Deskripsi role', created_at: '', updated_at: '' }
}

const PERMISSIONS = [
  { code: 'templates.read', description: 'Melihat template' },
  { code: 'templates.write', description: 'Membuat template' },
  { code: 'guests.read', description: 'Melihat tamu' },
]

const MENUS = [
  {
    key: 'admin.dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: 'grid',
    parent_key: null,
    sort_order: 10,
  },
  {
    key: 'admin.users',
    label: 'Pengguna & Role',
    path: '/admin/pengguna',
    icon: 'user-cog',
    parent_key: null,
    sort_order: 50,
  },
  {
    key: 'app.home',
    label: 'Beranda',
    path: '/app',
    icon: 'home',
    parent_key: null,
    sort_order: 10,
  },
]

async function mountView(roleId = 'r-op'): Promise<VueWrapper> {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'landing', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/admin/pengguna/role', name: 'admin-roles', component: stub },
      {
        path: '/admin/pengguna/role/:id',
        name: 'admin-role-access',
        component: AdminRoleAccessView,
      },
    ],
  })
  await router.push(`/admin/pengguna/role/${roleId}`)
  await router.isReady()
  const wrapper = mount(AdminRoleAccessView, {
    attachTo: document.body,
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

function lastToast() {
  const list = useToast().toasts.value
  return list[list.length - 1]
}

const save = (wrapper: VueWrapper) =>
  wrapper.findAll('button').find((b) => /^(Simpan|Menyimpan)/.test(b.text()))!
const cancel = (wrapper: VueWrapper) =>
  wrapper.findAll('button').find((b) => b.text() === 'Batalkan')!
const permBox = (wrapper: VueWrapper, code: string) =>
  wrapper.findAll('label.nk-access__row').find((r) => r.find('code').text() === code)!
const menuSwitch = (wrapper: VueWrapper, label: string) =>
  wrapper
    .findAll('.nk-access__row--menu')
    .find((r) => r.text().includes(label))!
    .find('button')

describe('AdminRoleAccessView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getRole).mockReset().mockResolvedValue(role('r-op', 'Operator'))
    vi.mocked(listPermissions).mockReset().mockResolvedValue({ data: PERMISSIONS, meta })
    vi.mocked(listCatalogMenus).mockReset().mockResolvedValue({ data: MENUS, meta })
    vi.mocked(getRolePermissions)
      .mockReset()
      .mockResolvedValue({ role_id: 'r-op', permissions: ['templates.read'] })
    vi.mocked(getRoleMenus)
      .mockReset()
      .mockResolvedValue({ role_id: 'r-op', menus: ['admin.dashboard'] })
    vi.mocked(setRolePermissions)
      .mockReset()
      .mockImplementation(async (_, permissions) => ({ role_id: 'r-op', permissions }))
    vi.mocked(setRoleMenus)
      .mockReset()
      .mockImplementation(async (_, menus) => ({ role_id: 'r-op', menus }))
  })

  afterEach(() => {
    const { toasts, dismiss } = useToast()
    toasts.value.forEach((t) => dismiss(t.id))
  })

  it('TC-UI-F5-46: memuat role, katalog, dan set role; izin dikelompokkan dan menu per area', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('h1').text()).toContain('Operator')
    expect(wrapper.find('.nk-status--info').text()).toBe('Kustom')
    expect(wrapper.findAll('.nk-access__legend').map((l) => l.text())).toEqual([
      'Template',
      'Tamu',
      'Area admin',
      'Area pelanggan',
    ])
    expect(
      (permBox(wrapper, 'templates.read').find('input').element as HTMLInputElement).checked,
    ).toBe(true)
    expect(
      (permBox(wrapper, 'templates.write').find('input').element as HTMLInputElement).checked,
    ).toBe(false)
    expect(wrapper.text()).toContain('1 dari 3 dipilih')
    expect(menuSwitch(wrapper, 'Dashboard').attributes('aria-checked')).toBe('true')
    expect(menuSwitch(wrapper, 'Beranda').attributes('aria-checked')).toBe('false')
    expect(save(wrapper).attributes('disabled')).toBeDefined()
    expect(cancel(wrapper).attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('TC-UI-F5-47: perubahan menandai baris ditambah/dicabut, menampilkan ringkasan, dan mengaktifkan Simpan', async () => {
    const wrapper = await mountView()

    await permBox(wrapper, 'templates.write').find('input').setValue(true)
    await permBox(wrapper, 'templates.read').find('input').setValue(false)
    await menuSwitch(wrapper, 'Pengguna & Role').trigger('click')

    expect(permBox(wrapper, 'templates.write').classes()).toContain('is-added')
    expect(permBox(wrapper, 'templates.write').text()).toContain('Ditambah')
    expect(permBox(wrapper, 'templates.read').classes()).toContain('is-removed')
    expect(permBox(wrapper, 'templates.read').text()).toContain('Dicabut')
    expect(wrapper.find('.nk-savebar__summary').text()).toBe('2 ditambah · 1 dicabut')
    expect(save(wrapper).attributes('disabled')).toBeUndefined()

    await cancel(wrapper).trigger('click')
    expect(wrapper.find('.nk-savebar__summary').exists()).toBe(false)
    expect(save(wrapper).attributes('disabled')).toBeDefined()
    expect(
      (permBox(wrapper, 'templates.read').find('input').element as HTMLInputElement).checked,
    ).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F5-48: simpan mengirim set lengkap hanya untuk bagian yang berubah lalu mereset baseline', async () => {
    const wrapper = await mountView()
    await permBox(wrapper, 'guests.read').find('input').setValue(true)

    await save(wrapper).trigger('click')
    await flushPromises()

    expect(setRolePermissions).toHaveBeenCalledWith('r-op', ['templates.read', 'guests.read'])
    expect(setRoleMenus).not.toHaveBeenCalled()
    expect(lastToast()?.message).toBe('Izin dan menu disimpan')
    expect(wrapper.find('.nk-savebar__summary').exists()).toBe(false)
    expect(save(wrapper).attributes('disabled')).toBeDefined()

    await menuSwitch(wrapper, 'Beranda').trigger('click')
    await save(wrapper).trigger('click')
    await flushPromises()
    expect(setRoleMenus).toHaveBeenCalledWith('r-op', ['admin.dashboard', 'app.home'])
    expect(setRolePermissions).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('TC-UI-F5-49: tombol Simpan nonaktif selama request sehingga klik ganda hanya mengirim satu request', async () => {
    let resolve: (v: { role_id: string; permissions: string[] }) => void = () => {}
    vi.mocked(setRolePermissions).mockReturnValue(new Promise((r) => (resolve = r)))
    const wrapper = await mountView()
    await permBox(wrapper, 'guests.read').find('input').setValue(true)

    await save(wrapper).trigger('click')
    await save(wrapper).trigger('click')
    expect(setRolePermissions).toHaveBeenCalledTimes(1)
    expect(save(wrapper).attributes('disabled')).toBeDefined()
    expect(save(wrapper).text()).toContain('Menyimpan…')
    expect(menuSwitch(wrapper, 'Dashboard').attributes('disabled')).toBeDefined()

    resolve({ role_id: 'r-op', permissions: ['templates.read', 'guests.read'] })
    await flushPromises()
    expect(save(wrapper).attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('TC-UI-F5-50: simpan sebagian gagal: bagian yang sudah tersimpan tidak diulang dan galat ditampilkan', async () => {
    vi.mocked(setRoleMenus).mockRejectedValue(new ApiError(403))
    const wrapper = await mountView()
    await permBox(wrapper, 'guests.read').find('input').setValue(true)
    await menuSwitch(wrapper, 'Beranda').trigger('click')

    await save(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('Kamu tidak punya akses untuk tindakan ini.')
    expect(wrapper.find('.nk-savebar__summary').text()).toBe('1 ditambah')
    expect(lastToast()).toBeUndefined()

    vi.mocked(setRoleMenus).mockResolvedValue({
      role_id: 'r-op',
      menus: ['admin.dashboard', 'app.home'],
    })
    await save(wrapper).trigger('click')
    await flushPromises()
    expect(setRolePermissions).toHaveBeenCalledTimes(1)
    expect(lastToast()?.message).toBe('Izin dan menu disimpan')
    wrapper.unmount()
  })

  it('TC-UI-F5-51: SuperAdmin hanya mode lihat: semua izin tercentang tapi terkunci, tanpa tombol Simpan', async () => {
    vi.mocked(getRole).mockResolvedValue(role('r-sa', 'SuperAdmin'))
    vi.mocked(getRolePermissions).mockResolvedValue({ role_id: 'r-sa', permissions: [] })
    const wrapper = await mountView('r-sa')

    expect(wrapper.find('.nk-status--brand').text()).toBe('Sistem')
    expect(wrapper.text()).toContain('hanya mode lihat')
    expect(wrapper.text()).toContain('SuperAdmin lolos semua izin lewat kode')
    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(3)
    for (const box of boxes) {
      expect((box.element as HTMLInputElement).checked).toBe(true)
      expect(box.attributes('disabled')).toBeDefined()
    }
    expect(
      wrapper.findAll('[role="switch"]').every((s) => s.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(wrapper.findAll('button').some((b) => b.text().startsWith('Simpan'))).toBe(false)
    wrapper.unmount()
  })

  it('TC-UI-F5-52: role User (sistem) boleh diatur izin dan menunya', async () => {
    vi.mocked(getRole).mockResolvedValue(role('r-user', 'User'))
    const wrapper = await mountView('r-user')

    expect(wrapper.find('.nk-status--brand').text()).toBe('Sistem')
    expect(wrapper.find('input[type="checkbox"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('button').some((b) => b.text().startsWith('Simpan'))).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F5-53: skeleton, role tidak ditemukan (404), galat dengan coba lagi, dan 403', async () => {
    let resolve: (v: Role) => void = () => {}
    vi.mocked(getRole).mockReturnValue(new Promise((r) => (resolve = r)))
    const loading = await mountView()
    expect(loading.find('[data-testid="access-loading"]').exists()).toBe(true)
    resolve(role('r-op', 'Operator'))
    await flushPromises()
    expect(loading.find('h1').text()).toContain('Operator')
    loading.unmount()

    vi.mocked(getRole).mockReset().mockRejectedValue(new ApiError(404))
    const missing = await mountView()
    expect(missing.text()).toContain('Role tidak ditemukan')
    expect(missing.find('a[href="/admin/pengguna/role"]').exists()).toBe(true)
    missing.unmount()

    vi.mocked(getRole)
      .mockReset()
      .mockRejectedValueOnce(new ApiError(500))
      .mockResolvedValue(role('r-op', 'Operator'))
    const failed = await mountView()
    expect(failed.find('[role="alert"]').text()).toContain('Izin dan menu belum bisa dimuat')
    await failed.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(failed.find('h1').text()).toContain('Operator')
    failed.unmount()

    vi.mocked(getRole).mockReset().mockRejectedValue(new ApiError(403))
    const denied = await mountView()
    expect(denied.text()).toContain('Kamu tidak punya akses')
    denied.unmount()
  })

  it('TC-UI-F5-54: tautan kembali ke daftar Role dan judul dokumen', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('a.nk-backlink').attributes('href')).toBe('/admin/pengguna/role')
    expect(document.title).toBe('Atur izin & menu | Niskala Daisy')
    wrapper.unmount()
  })
})
