<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import { deleteRole, listRoles } from '@/api/roles'
import { listUsers } from '@/api/users'
import ActionMenu, { type ActionItem } from '@/components/ActionMenu.vue'
import AppDialog from '@/components/AppDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import NkIcon from '@/components/NkIcon.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import ResponsiveTable, { type TableColumn } from '@/components/ResponsiveTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ADMIN_TABLE_PAGE_SIZE } from '@/constants/admin'
import { ROLES, isSystemRole } from '@/constants/roles'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { usePagedList } from '@/composables/usePagedList'
import { useToast } from '@/composables/useToast'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'
import { describeError } from '@/utils/api-error'
import { formatNumber } from '@/utils/relative-time'
import AccountTabs from './accounts/AccountTabs.vue'
import RoleFormDialog from './accounts/RoleFormDialog.vue'
import RoleInUseDialog from './accounts/RoleInUseDialog.vue'

useDocumentTitle('Pengguna & Role')

const USER_SCAN_LIMIT = 100

const router = useRouter()
const toast = useToast()

const list = usePagedList({
  limit: ADMIN_TABLE_PAGE_SIZE,
  filters: () => ({}),
  fetcher: listRoles,
})
onMounted(() => void list.load())

const columns: TableColumn[] = [
  { key: 'role', label: 'Role', role: 'primary' },
  { key: 'kind', label: 'Jenis', role: 'status' },
  { key: 'actions', label: 'Aksi', role: 'action' },
]

const subtitle = computed(() => {
  if (list.status.value !== 'ready') {
    return ''
  }
  const system = list.items.value.filter((r) => isSystemRole(r.name)).length
  return `${formatNumber(list.total.value)} role · ${formatNumber(system)} role sistem tidak bisa diubah atau dihapus`
})

const menuItems: ActionItem[] = [
  { key: 'edit', label: 'Ubah', icon: 'edit-3' },
  { key: 'delete', label: 'Hapus', icon: 'trash-2', danger: true, separated: true },
]

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const target = ref<Role | null>(null)
const deleteOpen = ref(false)
const deleteBusy = ref(false)
const deleteError = ref('')
const inUseOpen = ref(false)
const inUseLoading = ref(false)
const inUseUsers = ref<User[]>([])
const inUsePartial = ref(false)

function openCreate(): void {
  formMode.value = 'create'
  target.value = null
  formOpen.value = true
}

function onAction(role: Role, key: string): void {
  target.value = role
  deleteError.value = ''
  if (key === 'edit') {
    formMode.value = 'edit'
    formOpen.value = true
  } else {
    deleteOpen.value = true
  }
}

async function onSaved(role: Role, mode: 'create' | 'edit'): Promise<void> {
  formOpen.value = false
  if (mode === 'create') {
    toast.success(`Role ${role.name} dibuat`)
    await router.push({ name: 'admin-role-access', params: { id: role.id } })
    return
  }
  toast.success('Perubahan disimpan')
  await list.load()
}

// Backend tidak punya filter pengguna per role: pengguna role ini dicari di 100 akun pertama.
async function showUsersOfRole(role: Role): Promise<void> {
  inUseUsers.value = []
  inUsePartial.value = false
  inUseLoading.value = true
  inUseOpen.value = true
  try {
    const result = await listUsers({ page: 1, limit: USER_SCAN_LIMIT })
    inUseUsers.value = result.data.filter((u) => u.role.id === role.id)
    inUsePartial.value = result.meta.total > USER_SCAN_LIMIT
  } catch {
    inUseUsers.value = []
  } finally {
    inUseLoading.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const role = target.value
  if (!role || deleteBusy.value) {
    return
  }
  deleteBusy.value = true
  deleteError.value = ''
  try {
    await deleteRole(role.id)
    deleteOpen.value = false
    toast.success(`Role ${role.name} dihapus`)
    await list.load()
    if (list.items.value.length === 0 && list.page.value > 1) {
      list.setPage(list.page.value - 1)
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      deleteOpen.value = false
      await showUsersOfRole(role)
    } else {
      deleteError.value = describeError(error)
    }
  } finally {
    deleteBusy.value = false
  }
}
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <header class="nk-page__head">
        <div>
          <h1 class="nk-page__title">Pengguna &amp; Role</h1>
          <p class="nk-page__lead">Kelola akun pengguna, role, serta izin dan menu tiap role.</p>
        </div>
        <AccountTabs />
      </header>

      <div class="nk-toolbar">
        <p class="nk-toolbar__note" aria-live="polite">{{ subtitle }}</p>
        <button type="button" class="nk-appbtn nk-appbtn--primary" @click="openCreate">
          Tambah role<NkIcon name="plus" :size="18" />
        </button>
      </div>

      <div
        v-if="list.status.value === 'loading' || list.status.value === 'idle'"
        data-testid="roles-loading"
        aria-busy="true"
      >
        <p class="nk-visually-hidden" role="status">Memuat role…</p>
        <div class="nk-skeleton nk-table-skeleton" aria-hidden="true"></div>
      </div>

      <EmptyState
        v-else-if="list.status.value === 'forbidden'"
        title="Kamu tidak punya akses"
        message="Halaman ini hanya untuk SuperAdmin."
      />

      <ErrorState
        v-else-if="list.status.value === 'error' || list.status.value === 'not-found'"
        title="Role belum bisa dimuat"
        @retry="list.load"
      />

      <EmptyState
        v-else-if="list.isEmpty.value"
        title="Belum ada role"
        message="Role yang kamu buat akan muncul di sini."
      />

      <template v-else>
        <ResponsiveTable
          caption="Daftar role"
          :columns="columns"
          :rows="list.items.value"
          :row-key="(row) => row.id"
        >
          <template #cell-role="{ row }">
            <div class="nk-person">
              <span
                class="nk-person__avatar"
                :class="{ 'nk-person__avatar--info': !isSystemRole(row.name) }"
                aria-hidden="true"
              >
                <NkIcon name="shield" :size="18" />
              </span>
              <span class="nk-person__text">
                <strong>{{ row.name }}</strong>
                <small>{{ row.description ?? 'Tanpa deskripsi' }}</small>
              </span>
            </div>
          </template>
          <template #cell-kind="{ row }">
            <StatusBadge
              :tone="isSystemRole(row.name) ? 'brand' : 'info'"
              :label="isSystemRole(row.name) ? 'Sistem' : 'Kustom'"
            />
          </template>
          <template #cell-actions="{ row }">
            <div class="nk-rowactions">
              <RouterLink
                class="nk-appbtn nk-appbtn--outline nk-appbtn--sm"
                :to="{ name: 'admin-role-access', params: { id: row.id } }"
              >
                {{ row.name === ROLES.SUPERADMIN ? 'Lihat' : 'Atur izin & menu' }}
                <NkIcon :name="row.name === ROLES.SUPERADMIN ? 'eye' : 'sliders'" :size="16" />
              </RouterLink>
              <ActionMenu
                v-if="!isSystemRole(row.name)"
                :label="`Aksi untuk ${row.name}`"
                :items="menuItems"
                @select="(key) => onAction(row, key)"
              />
            </div>
          </template>
        </ResponsiveTable>

        <PaginationBar
          :page="list.page.value"
          :limit="ADMIN_TABLE_PAGE_SIZE"
          :total="list.total.value"
          @update:page="list.setPage"
        />
      </template>
    </div>

    <RoleFormDialog
      :open="formOpen"
      :mode="formMode"
      :role="target"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <AppDialog
      :open="deleteOpen"
      :title="`Hapus role ${target?.name ?? ''}?`"
      description="Role dihapus permanen beserta pengaturan izin dan menunya. Role yang masih dipakai pengguna tidak bisa dihapus."
      :busy="deleteBusy"
      size="sm"
      @close="deleteOpen = false"
    >
      <template #icon>
        <span class="nk-modal__icon nk-modal__icon--danger"
          ><NkIcon name="trash-2" :size="22"
        /></span>
      </template>
      <p v-if="deleteError" class="nk-form__error" role="alert">{{ deleteError }}</p>
      <div class="nk-modal__actions">
        <button
          type="button"
          class="nk-appbtn nk-appbtn--outline"
          :disabled="deleteBusy"
          @click="deleteOpen = false"
        >
          Batal
        </button>
        <button
          type="button"
          class="nk-appbtn nk-appbtn--danger"
          :disabled="deleteBusy"
          @click="confirmDelete"
        >
          {{ deleteBusy ? 'Menghapus…' : 'Hapus role' }}
        </button>
      </div>
    </AppDialog>

    <RoleInUseDialog
      :open="inUseOpen"
      :role="target"
      :users="inUseUsers"
      :partial="inUsePartial"
      :loading="inUseLoading"
      @close="inUseOpen = false"
    />
  </AppShellLayout>
</template>
