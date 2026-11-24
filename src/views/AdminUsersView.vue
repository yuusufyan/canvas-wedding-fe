<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listRoles } from '@/api/roles'
import { deleteUser, listUsers, updateUser } from '@/api/users'
import ActionMenu, { type ActionItem } from '@/components/ActionMenu.vue'
import ConfirmTypeDialog from '@/components/ConfirmTypeDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import NkIcon from '@/components/NkIcon.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import ResponsiveTable, { type TableColumn } from '@/components/ResponsiveTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ADMIN_TABLE_PAGE_SIZE } from '@/constants/admin'
import { ROLES } from '@/constants/roles'
import { useAsyncState } from '@/composables/useAsyncState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { usePagedList } from '@/composables/usePagedList'
import { useToast } from '@/composables/useToast'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user'
import { describeError } from '@/utils/api-error'
import { formatDate } from '@/utils/format'
import { formatNumber } from '@/utils/relative-time'
import AccountTabs from './accounts/AccountTabs.vue'
import UserDeactivateDialog from './accounts/UserDeactivateDialog.vue'
import UserFormDialog from './accounts/UserFormDialog.vue'

useDocumentTitle('Pengguna & Role')

const MODAL_ROLE_LIMIT = 100

const authStore = useAuthStore()
const toast = useToast()

const list = usePagedList({
  limit: ADMIN_TABLE_PAGE_SIZE,
  filters: () => ({}),
  fetcher: listUsers,
})
const roles = useAsyncState(
  async () => (await listRoles({ page: 1, limit: MODAL_ROLE_LIMIT })).data,
)

onMounted(() => {
  void list.load()
  void roles.load()
})

const columns: TableColumn[] = [
  { key: 'user', label: 'Pengguna', role: 'primary' },
  { key: 'role', label: 'Role', role: 'meta' },
  { key: 'status', label: 'Status', role: 'status' },
  { key: 'createdAt', label: 'Dibuat', role: 'meta' },
  { key: 'actions', label: 'Aksi', role: 'action' },
]

function isSelf(user: User | null): boolean {
  return Boolean(user && user.id === authStore.profile?.id)
}

function roleTone(name: string) {
  if (name === ROLES.SUPERADMIN) {
    return 'brand' as const
  }
  return name === ROLES.USER ? ('neutral' as const) : ('info' as const)
}

function initial(user: User): string {
  return user.name.trim().charAt(0).toUpperCase()
}

function menuItems(user: User): ActionItem[] {
  return [
    { key: 'edit', label: 'Ubah', icon: 'edit-3' },
    user.isActive
      ? { key: 'deactivate', label: 'Nonaktifkan', icon: 'lock', separated: true }
      : { key: 'activate', label: 'Aktifkan', icon: 'check-circle', separated: true },
    { key: 'delete', label: 'Hapus', icon: 'trash-2', danger: true },
  ]
}

const subtitle = computed(() =>
  list.status.value === 'ready' ? `${formatNumber(list.total.value)} pengguna terdaftar` : '',
)

// Dialog: satu aksi aktif pada satu waktu.
const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const target = ref<User | null>(null)
const deactivateOpen = ref(false)
const deleteOpen = ref(false)
const dialogBusy = ref(false)
const dialogError = ref('')
const rowBusyId = ref<string | null>(null)

function openCreate(): void {
  formMode.value = 'create'
  target.value = null
  formOpen.value = true
}

async function onAction(user: User, key: string): Promise<void> {
  target.value = user
  dialogError.value = ''
  if (key === 'edit') {
    formMode.value = 'edit'
    formOpen.value = true
  } else if (key === 'deactivate') {
    deactivateOpen.value = true
  } else if (key === 'delete') {
    deleteOpen.value = true
  } else if (key === 'activate') {
    await runActivate(user)
  }
}

async function runActivate(user: User): Promise<void> {
  if (rowBusyId.value) {
    return
  }
  rowBusyId.value = user.id
  try {
    await updateUser(user.id, { isActive: true })
    toast.success(`Akun ${user.name} diaktifkan`)
    await list.load()
  } catch (error) {
    toast.error(describeError(error))
  } finally {
    rowBusyId.value = null
  }
}

async function onSaved(user: User, mode: 'create' | 'edit'): Promise<void> {
  formOpen.value = false
  toast.success(mode === 'create' ? `Pengguna ${user.name} ditambahkan` : 'Perubahan disimpan')
  await list.load()
}

async function confirmDeactivate(): Promise<void> {
  const user = target.value
  if (!user || dialogBusy.value || isSelf(user)) {
    return
  }
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await updateUser(user.id, { isActive: false })
    deactivateOpen.value = false
    toast.success(`Akun ${user.name} dinonaktifkan`)
    await list.load()
  } catch (error) {
    dialogError.value = describeError(
      error,
      'Ditolak: SuperAdmin aktif terakhir atau akunmu sendiri tidak bisa dinonaktifkan.',
    )
  } finally {
    dialogBusy.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const user = target.value
  if (!user || dialogBusy.value || isSelf(user)) {
    return
  }
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await deleteUser(user.id)
    deleteOpen.value = false
    toast.success(`Pengguna ${user.name} dihapus`)
    await list.load()
    if (list.items.value.length === 0 && list.page.value > 1) {
      list.setPage(list.page.value - 1)
    }
  } catch (error) {
    dialogError.value = describeError(
      error,
      'Ditolak: SuperAdmin aktif terakhir atau akunmu sendiri tidak bisa dihapus.',
    )
  } finally {
    dialogBusy.value = false
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
          <NkIcon name="user-plus" :size="18" />Tambah pengguna
        </button>
      </div>

      <div
        v-if="list.status.value === 'loading' || list.status.value === 'idle'"
        data-testid="users-loading"
        aria-busy="true"
      >
        <p class="nk-visually-hidden" role="status">Memuat pengguna…</p>
        <div class="nk-skeleton nk-table-skeleton" aria-hidden="true"></div>
      </div>

      <EmptyState
        v-else-if="list.status.value === 'forbidden'"
        title="Kamu tidak punya akses"
        message="Halaman ini hanya untuk SuperAdmin."
      />

      <ErrorState
        v-else-if="list.status.value === 'error' || list.status.value === 'not-found'"
        title="Pengguna belum bisa dimuat"
        @retry="list.load"
      />

      <EmptyState
        v-else-if="list.isEmpty.value"
        title="Belum ada pengguna"
        message="Akun yang kamu tambahkan akan muncul di sini."
      >
        <button
          type="button"
          class="nk-appbtn nk-appbtn--primary nk-appbtn--sm"
          @click="openCreate"
        >
          Tambah pengguna
        </button>
      </EmptyState>

      <template v-else>
        <ResponsiveTable
          caption="Daftar pengguna"
          :columns="columns"
          :rows="list.items.value"
          :row-key="(row) => row.id"
        >
          <template #cell-user="{ row }">
            <div class="nk-person">
              <span class="nk-person__avatar" aria-hidden="true">{{ initial(row) }}</span>
              <span class="nk-person__text">
                <strong>
                  {{ row.name }}
                  <span v-if="isSelf(row)" class="nk-selftag">Kamu</span>
                </strong>
                <small>{{ row.email }}</small>
              </span>
            </div>
          </template>
          <template #cell-role="{ row }">
            <StatusBadge :tone="roleTone(row.role.name)" :label="row.role.name" />
          </template>
          <template #cell-status="{ row }">
            <StatusBadge
              :tone="row.isActive ? 'success' : 'neutral'"
              :label="row.isActive ? 'Aktif' : 'Nonaktif'"
            />
          </template>
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
          <template #cell-actions="{ row }">
            <ActionMenu
              :label="`Aksi untuk ${row.name}`"
              :items="menuItems(row)"
              :disabled="rowBusyId === row.id"
              @select="(key) => onAction(row, key)"
            />
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

    <UserFormDialog
      :open="formOpen"
      :mode="formMode"
      :user="target"
      :roles="roles.data.value ?? []"
      :is-self="isSelf(target)"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <UserDeactivateDialog
      :open="deactivateOpen"
      :user="target"
      :is-self="isSelf(target)"
      :busy="dialogBusy"
      :error="dialogError"
      @close="deactivateOpen = false"
      @confirm="confirmDeactivate"
    />

    <ConfirmTypeDialog
      :open="deleteOpen"
      :title="`Hapus ${target?.name ?? ''}?`"
      :description="`Akun dihapus dan tidak bisa masuk lagi. Email ${target?.email ?? ''} juga tidak bisa dipakai mendaftar ulang.`"
      :expected="target?.email ?? ''"
      input-label="Ketik email untuk konfirmasi"
      confirm-label="Hapus pengguna"
      :busy="dialogBusy"
      :blocked="isSelf(target)"
      :error="dialogError"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    >
      <p v-if="isSelf(target)" class="nk-note nk-note--warning">
        <NkIcon name="lock" :size="16" />Akunmu sendiri tidak bisa dihapus.
      </p>
      <p v-else class="nk-note">
        <NkIcon name="info" :size="16" />SuperAdmin aktif terakhir tidak bisa dihapus.
      </p>
    </ConfirmTypeDialog>
  </AppShellLayout>
</template>
