import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import RolesView from '../RolesView.vue'
import * as rolesApi from '@/api/roles'
import { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/role'

vi.mock('@/api/roles', () => ({
  listRoles: vi.fn<typeof rolesApi.listRoles>(),
  createRole: vi.fn<typeof rolesApi.createRole>(),
  updateRole: vi.fn<typeof rolesApi.updateRole>(),
  deleteRole: vi.fn<typeof rolesApi.deleteRole>(),
}))

const meta = { total: 2, page: 1, limit: 10, total_pages: 1, total_results: 2 }

const superAdminRole: Role = {
  id: 'r-admin',
  name: 'SuperAdmin',
  description: 'Administrator Tertinggi',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const customRole: Role = {
  id: 'r-staff',
  name: 'Staff',
  description: 'Staf Operasional',
  created_at: '2026-01-02T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function setRole(isSuperAdmin = true) {
  useAuthStore().$patch({
    isAuthenticated: true,
    profile: {
      id: 'u-1',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: isSuperAdmin ? { id: 'r-admin', name: 'SuperAdmin' } : { id: 'r-staff', name: 'Staff' },
      is_active: true,
    },
  })
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/roles', name: 'roles', component: RolesView },
      { path: '/users', name: 'users', component: { template: '<div>users</div>' } },
    ],
  })
  await router.push('/roles')
  await router.isReady()
  const wrapper = mount(RolesView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('RolesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(rolesApi.listRoles).mockResolvedValue({
      data: [superAdminRole, customRole],
      meta,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders role list with system badge on SuperAdmin and disables delete on it', async () => {
    setRole(true)
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('SuperAdmin')
    expect(wrapper.text()).toContain('Staff')
    expect(wrapper.text()).toContain('Sistem')
    expect(wrapper.find('[data-testid="btn-add-role"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-delete-r-admin"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper.find('[data-testid="btn-delete-r-staff"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('validates role creation and submits payload', async () => {
    setRole(true)
    let resolveCreate: (value: Role) => void = () => {}
    vi.mocked(rolesApi.createRole).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-add-role"]').trigger('click')
    await flushPromises()

    // Validate minimum 3 chars
    await wrapper.find('#role-name').setValue('ab')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Nama role wajib antara 3 sampai 50 karakter.')

    // Validate valid pattern
    await wrapper.find('#role-name').setValue('Manager!')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Nama role hanya boleh memuat huruf')

    await wrapper.find('#role-name').setValue('Manager')
    await wrapper.find('#role-description').setValue('Manajer Operasional')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')

    expect(rolesApi.createRole).toHaveBeenCalledTimes(1)
    expect(rolesApi.createRole).toHaveBeenCalledWith({
      name: 'Manager',
      description: 'Manajer Operasional',
    })

    resolveCreate({
      id: 'r-3',
      name: 'Manager',
      description: 'Manajer Operasional',
      created_at: '',
      updated_at: '',
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Role "Manager" berhasil ditambahkan.')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sends only changed fields on edit and maps conflict error', async () => {
    setRole(true)
    vi.mocked(rolesApi.updateRole).mockRejectedValueOnce(new ApiError(409))
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-edit-r-staff"]').trigger('click')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Tidak ada perubahan untuk disimpan.')

    await wrapper.find('#role-description').setValue('Staf Lapangan')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(rolesApi.updateRole).toHaveBeenCalledWith('r-staff', { description: 'Staf Lapangan' })
    expect(wrapper.text()).toContain('Nama role sudah dipakai.')
  })

  it('deletes a custom role', async () => {
    setRole(true)
    vi.mocked(rolesApi.deleteRole).mockResolvedValueOnce(null)
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-delete-r-staff"]').trigger('click')
    await flushPromises()

    expect(rolesApi.deleteRole).toHaveBeenCalledWith('r-staff')
    expect(wrapper.text()).toContain('Role "Staff" berhasil dihapus.')
  })

  it('shows empty state and error state', async () => {
    setRole(true)
    vi.mocked(rolesApi.listRoles).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 10, total_pages: 0, total_results: 0 },
    })
    const empty = await mountView()
    expect(empty.text()).toContain('Belum ada role yang terdaftar.')

    vi.mocked(rolesApi.listRoles).mockRejectedValueOnce(new ApiError(500))
    const failed = await mountView()
    expect(failed.text()).toContain('Gagal memuat daftar role.')
  })
})
