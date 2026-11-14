<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '@/api/http'
import { createRole, deleteRole, listRoles, updateRole } from '@/api/roles'
import FeatherIcon from '@/components/FeatherIcon.vue'
import { usePermission } from '@/composables/usePermission'
import { ROLES } from '@/constants/roles'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import type { Role, UpdateRoleRequest } from '@/types/role'
import { formatDate } from '@/utils/format'

const { isSuperAdmin } = usePermission()

const canCreate = computed(() => isSuperAdmin.value)
const canUpdate = computed(() => isSuperAdmin.value)
const canDelete = computed(() => isSuperAdmin.value)
const showActionColumn = computed(() => canUpdate.value || canDelete.value)

const items = ref<Role[]>([])
const page = ref(1)
const limit = ref(10)
const totalPages = ref(1)
const totalItems = ref(0)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')

const modalMode = ref<'create' | 'edit' | null>(null)
const target = ref<Role | null>(null)
const formName = ref('')
const formDescription = ref('')
const formError = ref('')
const submitting = ref(false)
const deletingId = ref<string | null>(null)

const ROLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/

const modalTitle = computed(() => {
  return modalMode.value === 'create' ? 'Tambah Role Baru' : 'Ubah Role'
})

function isSystemRole(role: Role): boolean {
  return role.name === ROLES.SUPERADMIN
}

function mapApiError(err: unknown, fallback: string, conflict: string): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return conflict
    if (err.status === 404) return 'Role tidak ditemukan.'
    if (err.status === 403) return 'Anda tidak memiliki akses untuk melakukan aksi ini.'
    if (err.status === 400)
      return 'Data role yang dimasukkan tidak valid atau role dilindungi sistem.'
  }
  return fallback
}

async function fetchRoles(targetPage = page.value): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listRoles({ page: targetPage, limit: limit.value })
    items.value = result.data
    page.value = result.meta.page
    totalPages.value = Math.max(1, result.meta.total_pages)
    totalItems.value = result.meta.total
  } catch (err) {
    errorMessage.value = mapApiError(err, 'Gagal memuat daftar role. Silakan coba lagi.', '')
  } finally {
    loading.value = false
  }
}

function resetForm(): void {
  formName.value = ''
  formDescription.value = ''
  formError.value = ''
}

function openModal(mode: 'create' | 'edit', role: Role | null = null): void {
  resetForm()
  modalMode.value = mode
  target.value = role
  if (mode === 'edit' && role) {
    formName.value = role.name
    formDescription.value = role.description ?? ''
  }
}

function closeModal(): void {
  if (submitting.value) return
  modalMode.value = null
  target.value = null
  resetForm()
}

function validateForm(): string {
  const name = formName.value.trim()
  if (name.length < 3 || name.length > 50) {
    return 'Nama role wajib antara 3 sampai 50 karakter.'
  }
  if (!ROLE_NAME_PATTERN.test(name)) {
    return 'Nama role hanya boleh memuat huruf, angka, spasi, dash (-), dan underscore (_).'
  }
  if (formDescription.value.length > 255) {
    return 'Deskripsi role maksimal 255 karakter.'
  }
  return ''
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
    const description = formDescription.value.trim() || null

    if (modalMode.value === 'create') {
      await createRole({ name, description })
      successMessage.value = `Role "${name}" berhasil ditambahkan.`
    } else if (target.value) {
      const payload: UpdateRoleRequest = {}
      if (name !== target.value.name) payload.name = name
      if (description !== (target.value.description ?? null)) payload.description = description

      if (Object.keys(payload).length === 0) {
        formError.value = 'Tidak ada perubahan untuk disimpan.'
        submitting.value = false
        return
      }
      await updateRole(target.value.id, payload)
      successMessage.value = `Role "${name}" berhasil diperbarui.`
    }

    submitting.value = false
    closeModal()
    await fetchRoles(page.value)
  } catch (err) {
    const conflict = 'Nama role sudah dipakai.'
    formError.value = mapApiError(err, 'Gagal menyimpan role. Silakan coba lagi.', conflict)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(role: Role): Promise<void> {
  if (deletingId.value) return
  deletingId.value = role.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await deleteRole(role.id)
    successMessage.value = `Role "${role.name}" berhasil dihapus.`
    const nextPage = items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value
    await fetchRoles(nextPage)
  } catch (err) {
    errorMessage.value = mapApiError(
      err,
      'Gagal menghapus role. Silakan coba lagi.',
      'Role sistem tidak dapat dihapus atau masih digunakan oleh user.',
    )
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  void fetchRoles()
})
</script>

<template>
  <VerticalLayout>
    <div class="content-header row">
      <div class="content-header-left col-12 mb-2">
        <div class="row breadcrumbs-top">
          <div class="col-12 d-flex justify-content-between align-items-center">
            <h2 class="content-header-title float-start mb-0">Manajemen Role</h2>
            <button
              v-if="canCreate"
              type="button"
              class="btn btn-primary"
              data-testid="btn-add-role"
              @click="openModal('create')"
            >
              <FeatherIcon name="plus" class="me-50" />Tambah Role
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
        <FeatherIcon name="shield" :size="48" class="text-muted mb-1" />
        <p class="text-muted mb-0">Belum ada role yang terdaftar.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Nama Role</th>
              <th>Deskripsi</th>
              <th>Dibuat</th>
              <th v-if="showActionColumn" class="text-end">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in items" :key="role.id">
              <td>
                <span class="fw-bold">{{ role.name }}</span>
                <span v-if="isSystemRole(role)" class="badge bg-light-warning ms-50">Sistem</span>
              </td>
              <td>{{ role.description || '-' }}</td>
              <td>{{ formatDate(role.created_at) }}</td>
              <td v-if="showActionColumn" class="text-end">
                <button
                  v-if="canUpdate"
                  type="button"
                  class="btn btn-sm btn-outline-primary me-50"
                  :data-testid="`btn-edit-${role.id}`"
                  @click="openModal('edit', role)"
                >
                  <FeatherIcon name="edit-2" class="me-25" />Ubah
                </button>
                <button
                  v-if="canDelete"
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :data-testid="`btn-delete-${role.id}`"
                  :disabled="isSystemRole(role) || deletingId === role.id"
                  @click="handleDelete(role)"
                >
                  <FeatherIcon name="trash-2" class="me-25" />
                  {{ deletingId === role.id ? 'Menghapus…' : 'Hapus' }}
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
        <small class="text-muted">Total: {{ totalItems }} role</small>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: page <= 1 }">
            <button
              type="button"
              class="page-link"
              :disabled="page <= 1"
              @click="fetchRoles(page - 1)"
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
              @click="fetchRoles(page + 1)"
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
                <label class="form-label" for="role-name">Nama Role</label>
                <input
                  id="role-name"
                  v-model="formName"
                  type="text"
                  class="form-control"
                  placeholder="Contoh: Admin"
                  required
                  :disabled="submitting"
                />
                <small class="text-muted">3–50 karakter, huruf, angka, spasi, _ atau -</small>
              </div>

              <div class="mb-1">
                <label class="form-label" for="role-description">Deskripsi</label>
                <textarea
                  id="role-description"
                  v-model="formDescription"
                  class="form-control"
                  rows="3"
                  placeholder="Keterangan hak akses role..."
                  :disabled="submitting"
                ></textarea>
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
