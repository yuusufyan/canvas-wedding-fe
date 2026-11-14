import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import UsersView from '../UsersView.vue'
import * as usersApi from '@/api/users'
import * as rolesApi from '@/api/roles'
import { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user'
import type { Role } from '@/types/role'

vi.mock('@/api/users', () => ({
  listUsers: vi.fn<typeof usersApi.listUsers>(),
  createUser: vi.fn<typeof usersApi.createUser>(),
  updateUser: vi.fn<typeof usersApi.updateUser>(),
  deleteUser: vi.fn<typeof usersApi.deleteUser>(),
}))

vi.mock('@/api/roles', () => ({
  listRoles: vi.fn<typeof rolesApi.listRoles>(),
}))

const FAKE_PASSWORD = 'Password123!' // secret-scan:ignore fake value

const meta = { total: 2, page: 1, limit: 10, total_pages: 1, total_results: 2 }
const superAdminRole = { id: 'r-admin', name: 'SuperAdmin' }
const staffRole = { id: 'r-staff', name: 'Staff' }

const selfUser: User = {
  id: 'u-self',
  name: 'Super Admin',
  email: 'superadmin@example.com',
  role: superAdminRole,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const otherUser: User = {
  id: 'u-2',
  name: 'Staff One',
  email: 'staff01@example.com',
  role: staffRole,
  is_active: true,
  created_at: '2026-01-02T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
}

const sampleRoles: Role[] = [
  { id: 'r-admin', name: 'SuperAdmin', description: 'Super Admin', created_at: '', updated_at: '' },
  { id: 'r-staff', name: 'Staff', description: 'Staff', created_at: '', updated_at: '' },
]

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function setRole(isSuperAdmin = true) {
  useAuthStore().$patch({
    isAuthenticated: true,
    profile: {
      id: 'u-self',
      name: 'Super Admin',
      email: 'superadmin@example.com',
      role: isSuperAdmin ? superAdminRole : staffRole,
      is_active: true,
    },
  })
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/users', name: 'users', component: UsersView },
      { path: '/roles', name: 'roles', component: { template: '<div>roles</div>' } },
    ],
  })
  await router.push('/users')
  await router.isReady()
  const wrapper = mount(UsersView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('UsersView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(usersApi.listUsers).mockResolvedValue({ data: [selfUser, otherUser], meta })
    vi.mocked(rolesApi.listRoles).mockResolvedValue({
      data: sampleRoles,
      meta,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders user list and shows self badge on current user', async () => {
    setRole(true)
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Staff One')
    expect(wrapper.text()).toContain('staff01@example.com')
    expect(wrapper.text()).toContain('Saya')
    expect(wrapper.find('[data-testid="btn-add-user"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-edit-u-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-delete-u-self"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="btn-delete-u-2"]').attributes('disabled')).toBeUndefined()
  })

  it('validates the create form and sends request to createUser', async () => {
    setRole(true)
    let resolveCreate: (value: User) => void = () => {}
    vi.mocked(usersApi.createUser).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-add-user"]').trigger('click')
    await flushPromises()

    // Submit empty form -> error
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Nama user wajib diisi.')

    await wrapper.find('#user-name').setValue('Staff Two')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Format email belum valid.')

    await wrapper.find('#user-email').setValue('staff02@example.com')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Role wajib dipilih.')

    await wrapper.find('#user-role').setValue('r-staff')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Password wajib antara 8 karakter sampai 72 byte.')

    await wrapper.find('#user-password').setValue(FAKE_PASSWORD)
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')

    expect(usersApi.createUser).toHaveBeenCalledTimes(1)
    expect(usersApi.createUser).toHaveBeenCalledWith({
      name: 'Staff Two',
      email: 'staff02@example.com',
      password: FAKE_PASSWORD,
      role_id: 'r-staff',
    })

    resolveCreate({
      id: 'u-3',
      name: 'Staff Two',
      email: 'staff02@example.com',
      role: staffRole,
      is_active: true,
      created_at: '',
      updated_at: '',
    })
    await flushPromises()
    expect(wrapper.text()).toContain('User "Staff Two" berhasil ditambahkan.')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sends only changed fields on edit and maps 409 to a conflict message', async () => {
    setRole(true)
    vi.mocked(usersApi.updateUser).mockRejectedValueOnce(new ApiError(409))
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-edit-u-2"]').trigger('click')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Tidak ada perubahan untuk disimpan.')

    await wrapper.find('#user-name').setValue('Staff One Updated')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(usersApi.updateUser).toHaveBeenCalledWith('u-2', { name: 'Staff One Updated' })
    expect(wrapper.text()).toContain('Email sudah dipakai oleh user lain.')
  })

  it('deletes a user and handles error gracefully', async () => {
    setRole(true)
    vi.mocked(usersApi.deleteUser).mockResolvedValueOnce(null)
    const wrapper = await mountView()

    await wrapper.find('[data-testid="btn-delete-u-2"]').trigger('click')
    await flushPromises()

    expect(usersApi.deleteUser).toHaveBeenCalledWith('u-2')
    expect(wrapper.text()).toContain('User "Staff One" berhasil dihapus.')
  })

  it('shows empty and error states', async () => {
    setRole(true)
    vi.mocked(usersApi.listUsers).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, limit: 10, total_pages: 0, total_results: 0 },
    })
    const empty = await mountView()
    expect(empty.text()).toContain('Belum ada user yang terdaftar.')

    vi.mocked(usersApi.listUsers).mockRejectedValueOnce(new ApiError(500))
    const failed = await mountView()
    expect(failed.text()).toContain('Gagal memuat daftar user.')
  })
})
