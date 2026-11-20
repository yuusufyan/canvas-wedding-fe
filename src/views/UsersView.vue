<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '@/api/http'
import { listRoles } from '@/api/roles'
import { createUser, deleteUser, listUsers, updateUser } from '@/api/users'
import FeatherIcon from '@/components/FeatherIcon.vue'
import { usePermission } from '@/composables/usePermission'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { RoleSummary } from '@/types/auth'
import type { UpdateUserRequest, User } from '@/types/user'
import { formatDate } from '@/utils/format'

const { isSuperAdmin } = usePermission()
const authStore = useAuthStore()

const canCreate = computed(() => isSuperAdmin.value)
const canUpdate = computed(() => isSuperAdmin.value)
const canDelete = computed(() => isSuperAdmin.value)
const showActionColumn = computed(() => canUpdate.value || canDelete.value)

const items = ref<User[]>([])
const page = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')

const roleOptions = ref<RoleSummary[]>([])
const modalMode = ref<'create' | 'edit' | null>(null)
const target = ref<User | null>(null)
const formName = ref('')
const formEmail = ref('')
const formPassword = ref('')
const formRoleId = ref('')
const formIsActive = ref(true)
const formError = ref('')
const submitting = ref(false)
const deletingId = ref<string | null>(null)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_BYTES = 72

const modalTitle = computed(() => {
  return modalMode.value === 'create' ? 'Tambah User Baru' : 'Ubah Data User'
})

function isSelf(user: User): boolean {
  return authStore.profile?.id === user.id || authStore.profile?.email === user.email
}

function mapApiError(err: unknown, fallback: string, conflict: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return conflict
    if (err.status === 404) return 'User tidak ditemukan.'
    if (err.status === 403) return 'Anda tidak memiliki akses untuk melakukan aksi ini.'
    if (err.status === 400) return 'Data user yang dimasukkan belum valid.'
  }
  return fallback
}

function passwordError(value: string): string {
  const bytes = new TextEncoder().encode(value).length
  if (value.length < PASSWORD_MIN_LENGTH || bytes > PASSWORD_MAX_BYTES) {
    return `Password wajib antara ${PASSWORD_MIN_LENGTH} karakter sampai ${PASSWORD_MAX_BYTES} byte.`
  }
  return ''
}

async function fetchUsers(targetPage = page.value): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listUsers({ page: targetPage, limit: limit.value })
    items.value = result.data
    page.value = result.meta.page
    totalPages.value = Math.max(1, result.meta.total_pages)
    totalItems.value = result.meta.total
  } catch (err) {
    errorMessage.value = mapApiError(err, 'Gagal memuat daftar user. Silakan coba lagi.', '')
  } finally {
    loading.value = false
  }
}

async function ensureRoleOptions(): Promise<void> {
  if (roleOptions.value.length > 0) return
  try {
    const result = await listRoles({ page: 1, limit: 100 })
    roleOptions.value = result.data.map((r) => ({ id: r.id, name: r.name }))
  } catch {
    formError.value = 'Gagal memuat daftar role. Tutup form lalu coba lagi.'
  }
}

function resetForm(): void {
  formName.value = ''
  formEmail.value = ''
  formPassword.value = ''
  formRoleId.value = ''
  formIsActive.value = true
  formError.value = ''
}

function openModal(mode: 'create' | 'edit', user: User | null = null): void {
  resetForm()
  modalMode.value = mode
  target.value = user
  if (mode === 'edit' && user) {
    formName.value = user.name
    formEmail.value = user.email
    formRoleId.value = user.role.id
    formIsActive.value = user.is_active
  }
  void ensureRoleOptions()
}

function closeModal(): void {
  if (submitting.value) return
  modalMode.value = null
  target.value = null
  resetForm()
}

function validateForm(): string {
  if (!formName.value.trim()) return 'Nama user wajib diisi.'
  if (!EMAIL_PATTERN.test(formEmail.value.trim())) return 'Format email belum valid.'
  if (!formRoleId.value) return 'Role wajib dipilih.'

  if (modalMode.value === 'create') {
    const error = passwordError(formPassword.value)
    if (error) return error
  } else if (modalMode.value === 'edit' && formPassword.value) {
    const error = passwordError(formPassword.value)
    if (error) return error
  }
  return ''
}

function buildUpdatePayload(user: User): UpdateUserRequest {
  const payload: UpdateUserRequest = {}
  const name = formName.value.trim()
  const email = formEmail.value.trim()
  if (name !== user.name) payload.name = name
  if (email !== user.email) payload.email = email
  if (formRoleId.value !== user.role.id) payload.role_id = formRoleId.value
  if (formIsActive.value !== user.is_active) payload.is_active = formIsActive.value
  if (formPassword.value) payload.password = formPassword.value
  return payload
}

async function handleSubmitForm(): Promise<void> {
  if (submitting.value) return
  formError.value = ''
  successMessage.value = ''
  const validation = validateForm()
  if (validation) {
    formError.value = validation
    return
  }

  submitting.value = true
  try {
    const name = formName.value.trim()
    const email = formEmail.value.trim()

    if (modalMode.value === 'create') {
      await createUser({
        name,
        email,
        password: formPassword.value,
        role_id: formRoleId.value,
      })
      successMessage.value = `User "${name}" berhasil ditambahkan.`
    } else if (target.value) {
      const payload = buildUpdatePayload(target.value)
      if (Object.keys(payload).length === 0) {
        formError.value = 'Tidak ada perubahan untuk disimpan.'
        submitting.value = false
        return
      }
      await updateUser(target.value.id, payload)
      successMessage.value = `User "${name}" berhasil diperbarui.`
    }

    submitting.value = false
    closeModal()
    await fetchUsers(page.value)
  } catch (err) {
    const conflict = 'Email sudah dipakai oleh user lain.'
    formError.value = mapApiError(err, 'Gagal menyimpan user. Silakan coba lagi.', conflict)
  } finally {
    submitting.value = false
    formPassword.value = ''
  }
}

async function handleDelete(user: User): Promise<void> {
  if (deletingId.value) return
  deletingId.value = user.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await deleteUser(user.id)
    successMessage.value = `User "${user.name}" berhasil dihapus.`
    const nextPage = items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value
    await fetchUsers(nextPage)
  } catch (err) {
    errorMessage.value = mapApiError(
      err,
      'Gagal menghapus user. Silakan coba lagi.',
      'User tidak dapat dihapus.',
    )
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  void fetchUsers()
})
</script>

<template>
  <VerticalLayout>
    <div class="content-header row">
      <div class="content-header-left col-12 mb-2">
        <div class="row breadcrumbs-top">
          <div class="col-12 d-flex justify-content-between align-items-center">
            <h2 class="content-header-title border-0 pe-0 mb-0">Manajemen Pengguna</h2>
            <button
              v-if="canCreate"
              type="button"
              class="btn btn-primary"
              data-testid="btn-add-user"
              @click="openModal('create')"
            >
              <FeatherIcon name="plus" class="me-50" />Tambah User
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="successMessage" class="alert alert-success" role="alert">
      <div class="alert-body">{{ successMessage }}</div>
    </div>
    <div v-if="errorMessage" class="alert alert-danger" role="alert">
      <div class="alert-body">{{ errorMessage }}</div>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Memuat…</span>
        </div>
      </div>

      <div v-else-if="items.length === 0" class="card-body text-center py-5">
        <FeatherIcon name="users" :size="48" class="text-muted mb-1" />
        <p class="text-muted mb-0">Belum ada user yang terdaftar.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th v-if="showActionColumn" class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in items" :key="user.id">
              <td>
                <span class="fw-bold">{{ user.name }}</span>
                <span v-if="isSelf(user)" class="badge bg-light-info ms-50">Saya</span>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge bg-light-primary">{{ user.role.name }}</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="user.is_active ? 'bg-light-success' : 'bg-light-secondary'"
                >
                  {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td v-if="showActionColumn" class="text-end text-nowrap">
                <button
                  v-if="canUpdate"
                  type="button"
                  class="btn btn-icon btn-sm btn-flat-primary"
                  title="Ubah"
                  aria-label="Ubah"
                  :data-testid="`btn-edit-${user.id}`"
                  @click="openModal('edit', user)"
                >
                  <FeatherIcon name="edit-2" />
                </button>
                <button
                  v-if="canDelete"
                  type="button"
                  class="btn btn-icon btn-sm btn-flat-danger"
                  title="Hapus"
                  aria-label="Hapus"
                  :data-testid="`btn-delete-${user.id}`"
                  :disabled="isSelf(user) || deletingId === user.id"
                  @click="handleDelete(user)"
                >
                  <span
                    v-if="deletingId === user.id"
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>
                  <FeatherIcon v-else name="trash-2" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && totalPages > 1"
        class="card-footer d-flex justify-content-between align-items-center"
      >
        <small class="text-muted">Total: {{ totalItems }} user</small>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: page <= 1 }">
            <button
              type="button"
              class="page-link"
              :disabled="page <= 1"
              @click="fetchUsers(page - 1)"
            >
              Sebelumnya
            </button>
          </li>
          <li class="page-item disabled">
            <span class="page-link">{{ page }} / {{ totalPages }}</span>
          </li>
          <li class="page-item" :class="{ disabled: page >= totalPages }">
            <button
              type="button"
              class="page-link"
              :disabled="page >= totalPages"
              @click="fetchUsers(page + 1)"
            >
              Berikutnya
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Modal Form (Create / Edit) -->
    <div
      v-if="modalMode"
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ modalTitle }}</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Tutup"
              :disabled="submitting"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="handleSubmitForm">
            <div class="modal-body">
              <div v-if="formError" class="alert alert-danger" role="alert">
                <div class="alert-body">{{ formError }}</div>
              </div>

              <div class="mb-1">
                <label class="form-label" for="user-name">Nama Lengkap</label>
                <input
                  id="user-name"
                  v-model="formName"
                  type="text"
                  class="form-control"
                  placeholder="Super Administrator"
                  required
                  :disabled="submitting"
                />
              </div>

              <div class="mb-1">
                <label class="form-label" for="user-email">Email</label>
                <input
                  id="user-email"
                  v-model="formEmail"
                  type="email"
                  class="form-control"
                  placeholder="admin@example.com"
                  required
                  :disabled="submitting"
                />
              </div>

              <div class="mb-1">
                <label class="form-label" for="user-role">Role</label>
                <select
                  id="user-role"
                  v-model="formRoleId"
                  class="form-select"
                  required
                  :disabled="submitting"
                >
                  <option value="" disabled>Pilih Role</option>
                  <option v-for="r in roleOptions" :key="r.id" :value="r.id">
                    {{ r.name }}
                  </option>
                </select>
              </div>

              <div v-if="modalMode === 'edit'" class="mb-1 form-check form-switch">
                <input
                  id="user-is-active"
                  v-model="formIsActive"
                  class="form-check-input"
                  type="checkbox"
                  :disabled="submitting"
                />
                <label class="form-check-label" for="user-is-active">Status Pengguna Aktif</label>
              </div>

              <div class="mb-1">
                <label class="form-label" for="user-password">
                  Kata Sandi
                  <span v-if="modalMode === 'edit'" class="text-muted fw-normal">
                    (Kosongkan jika tidak ingin mengubah)
                  </span>
                </label>
                <input
                  id="user-password"
                  v-model="formPassword"
                  type="password"
                  class="form-control"
                  placeholder="Minimal 8 karakter"
                  :required="modalMode === 'create'"
                  :disabled="submitting"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="submitting"
                @click="closeModal"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-50"
                  aria-hidden="true"
                ></span>
                {{ submitting ? 'Menyimpan…' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </VerticalLayout>
</template>
