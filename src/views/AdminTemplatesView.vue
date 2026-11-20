<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  archiveTemplate,
  deleteTemplate,
  getTemplateCounts,
  listTemplates,
  publishTemplate,
  updateTemplate,
} from '@/api/templates'
import AccessBadge from '@/components/AccessBadge.vue'
import ConfirmTypeDialog from '@/components/ConfirmTypeDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterChips, { type ChipOption } from '@/components/FilterChips.vue'
import NkIcon from '@/components/NkIcon.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import ResponsiveTable, { type TableColumn } from '@/components/ResponsiveTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ADMIN_PAGE_SIZE, TEMPLATE_STATUS_TONE } from '@/constants/admin'
import { useAsyncState } from '@/composables/useAsyncState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { usePagedList } from '@/composables/usePagedList'
import { useToast } from '@/composables/useToast'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import type { AdminTemplate, TemplateSort, TemplateStatus } from '@/types/admin'
import type { TemplateAccess } from '@/types/invitation-document'
import { describeError } from '@/utils/api-error'
import { formatNumber, formatRelativeTime } from '@/utils/relative-time'
import TemplateArchiveDialog from './admin/TemplateArchiveDialog.vue'
import TemplateActionMenu, { type TemplateAction } from './admin/TemplateActionMenu.vue'
import TemplateCard from './admin/TemplateCard.vue'
import TemplateCreateDialog from './admin/TemplateCreateDialog.vue'

useDocumentTitle('Template')

const SEARCH_DEBOUNCE_MS = 300
const SKELETON_COUNT = 8

const toast = useToast()

const status = ref<TemplateStatus | ''>('')
const access = ref<TemplateAccess | ''>('')
const sort = ref<TemplateSort>('updated_desc')
const view = ref<'grid' | 'list'>('grid')
const searchText = ref('')
const query = ref('')

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchText, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (query.value = value.trim()), SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const list = usePagedList({
  limit: ADMIN_PAGE_SIZE,
  filters: () => ({
    status: status.value || undefined,
    access: access.value || undefined,
    q: query.value || undefined,
    sort: sort.value,
  }),
  fetcher: listTemplates,
})

const counts = useAsyncState(getTemplateCounts)

const statusOptions = computed<ChipOption<TemplateStatus>[]>(() => {
  const c = counts.data.value
  const count = (n: number | undefined) => (c ? formatNumber(n ?? 0) : undefined)
  return [
    { value: '', label: 'Semua', count: count(c?.all) },
    { value: 'Terbit', label: 'Terbit', count: count(c?.published) },
    { value: 'Draft', label: 'Draft', count: count(c?.draft) },
    { value: 'Arsip', label: 'Arsip', count: count(c?.archived) },
  ]
})

const hasFilters = computed(() => Boolean(status.value || access.value || query.value))

const columns: TableColumn[] = [
  { key: 'name', label: 'Template', role: 'primary' },
  { key: 'access', label: 'Akses', role: 'meta' },
  { key: 'status', label: 'Status', role: 'status' },
  { key: 'page_count', label: 'Halaman', role: 'meta' },
  { key: 'updated_at', label: 'Diperbarui', role: 'meta' },
  { key: 'actions', label: 'Aksi', role: 'action' },
]

function resetFilters(): void {
  status.value = ''
  access.value = ''
  searchText.value = ''
  query.value = ''
}

async function refresh(): Promise<void> {
  await Promise.all([list.load(), counts.load()])
  // Item terakhir di halaman terakhir dihapus/diarsipkan: mundur satu halaman.
  if (list.items.value.length === 0 && list.page.value > 1) {
    list.setPage(list.page.value - 1)
  }
}

onMounted(() => {
  void list.load()
  void counts.load()
})

// Aksi per template. busyId mencegah aksi ganda pada kartu yang sama.
const busyId = ref<string | null>(null)
const createOpen = ref(false)
const archiveTarget = ref<AdminTemplate | null>(null)
const deleteTarget = ref<AdminTemplate | null>(null)
const dialogBusy = ref(false)
const dialogError = ref('')

async function runInline(template: AdminTemplate, task: () => Promise<unknown>, done: string) {
  if (busyId.value) {
    return
  }
  busyId.value = template.id
  try {
    await task()
    toast.success(done)
    await refresh()
  } catch (error) {
    toast.error(describeError(error))
  } finally {
    busyId.value = null
  }
}

function onAction(template: AdminTemplate, action: TemplateAction): void {
  dialogError.value = ''
  if (action === 'archive') {
    archiveTarget.value = template
  } else if (action === 'delete') {
    deleteTarget.value = template
  } else if (action === 'publish') {
    void runInline(
      template,
      () => publishTemplate(template.id),
      template.status === 'Arsip' ? 'Template dipulihkan' : 'Template diterbitkan',
    )
  } else {
    const next: TemplateAccess = template.access === 'Premium' ? 'Gratis' : 'Premium'
    void runInline(
      template,
      () => updateTemplate(template.id, { access: next }),
      `Akses template diubah ke ${next}`,
    )
  }
}

async function onCreated(template: AdminTemplate): Promise<void> {
  createOpen.value = false
  toast.success(`Template “${template.name}” dibuat`)
  await refresh()
}

async function confirmArchive(): Promise<void> {
  const target = archiveTarget.value
  if (!target || dialogBusy.value) {
    return
  }
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await archiveTemplate(target.id)
    archiveTarget.value = null
    toast.success(`Template “${target.name}” diarsipkan`)
    await refresh()
  } catch (error) {
    dialogError.value = describeError(error)
  } finally {
    dialogBusy.value = false
  }
}

async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target || dialogBusy.value) {
    return
  }
  dialogBusy.value = true
  dialogError.value = ''
  try {
    await deleteTemplate(target.id)
    deleteTarget.value = null
    toast.success(`Template “${target.name}” dihapus`)
    await refresh()
  } catch (error) {
    dialogError.value = describeError(
      error,
      'Template ini dipakai undangan, jadi hanya bisa diarsipkan.',
    )
  } finally {
    dialogBusy.value = false
  }
}

function archiveInstead(): void {
  archiveTarget.value = deleteTarget.value
  deleteTarget.value = null
  dialogError.value = ''
}
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <header class="nk-page__head">
        <div>
          <h1 class="nk-page__title">Template Undangan</h1>
          <p class="nk-page__lead">
            Kelola desain template yang dipakai pelanggan. Klik template untuk menyuntingnya di
            Canvas.
          </p>
        </div>
        <button type="button" class="nk-appbtn nk-appbtn--primary" @click="createOpen = true">
          <NkIcon name="plus" :size="18" />Template baru
        </button>
      </header>

      <div class="nk-toolbar">
        <FilterChips v-model="status" label="Filter status" :options="statusOptions" />
        <div class="nk-toolbar__controls">
          <div class="nk-search">
            <NkIcon name="search" :size="16" />
            <label class="nk-visually-hidden" for="template-search">Cari template</label>
            <input
              id="template-search"
              v-model="searchText"
              class="nk-input nk-input--search"
              type="search"
              placeholder="Cari template"
              autocomplete="off"
            />
          </div>
          <label class="nk-visually-hidden" for="template-access">Filter akses</label>
          <select id="template-access" v-model="access" class="nk-select">
            <option value="">Semua akses</option>
            <option value="Gratis">Gratis</option>
            <option value="Premium">Premium</option>
          </select>
          <label class="nk-visually-hidden" for="template-sort">Urutkan</label>
          <select id="template-sort" v-model="sort" class="nk-select">
            <option value="updated_desc">Terbaru diperbarui</option>
            <option value="name_asc">Nama A-Z</option>
          </select>
          <div class="nk-viewtoggle" role="group" aria-label="Tampilan">
            <button
              type="button"
              class="nk-iconbtn"
              :class="{ 'is-active': view === 'grid' }"
              :aria-pressed="view === 'grid'"
              aria-label="Tampilan kartu"
              @click="view = 'grid'"
            >
              <NkIcon name="grid" :size="18" />
            </button>
            <button
              type="button"
              class="nk-iconbtn"
              :class="{ 'is-active': view === 'list' }"
              :aria-pressed="view === 'list'"
              aria-label="Tampilan daftar"
              @click="view = 'list'"
            >
              <NkIcon name="list" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="list.status.value === 'loading' || list.status.value === 'idle'"
        data-testid="templates-loading"
        aria-busy="true"
      >
        <p class="nk-visually-hidden" role="status">Memuat template…</p>
        <div class="nk-tgrid" aria-hidden="true">
          <div v-for="n in SKELETON_COUNT" :key="n" class="nk-skeleton nk-tgrid__skeleton"></div>
        </div>
      </div>

      <EmptyState
        v-else-if="list.status.value === 'forbidden'"
        title="Kamu tidak punya akses"
        message="Halaman ini hanya untuk SuperAdmin. Hubungi administrator bila kamu merasa seharusnya bisa membukanya."
      />

      <ErrorState
        v-else-if="list.status.value === 'error' || list.status.value === 'not-found'"
        title="Template belum bisa dimuat"
        @retry="list.load"
      />

      <EmptyState
        v-else-if="list.isEmpty.value && hasFilters"
        title="Tidak ada template untuk filter ini"
        message="Coba ubah kata kunci atau filter yang dipakai."
      >
        <button
          type="button"
          class="nk-appbtn nk-appbtn--outline nk-appbtn--sm"
          @click="resetFilters"
        >
          Reset filter
        </button>
      </EmptyState>

      <EmptyState
        v-else-if="list.isEmpty.value"
        title="Belum ada template"
        message="Template yang kamu buat akan muncul di sini dan bisa dipilih pelanggan setelah diterbitkan."
      >
        <button
          type="button"
          class="nk-appbtn nk-appbtn--primary nk-appbtn--sm"
          @click="createOpen = true"
        >
          Buat template pertama
        </button>
      </EmptyState>

      <template v-else>
        <div v-if="view === 'grid'" class="nk-tgrid" data-testid="templates-grid">
          <TemplateCard
            v-for="template in list.items.value"
            :key="template.id"
            :template="template"
            :busy="busyId === template.id"
            @action="(action) => onAction(template, action)"
          />
        </div>
        <ResponsiveTable
          v-else
          caption="Daftar template"
          :columns="columns"
          :rows="list.items.value"
          :row-key="(row) => row.id"
        >
          <template #cell-name="{ row }">
            <RouterLink
              class="nk-tablelink"
              :to="{ name: 'admin-template-editor', params: { id: row.id } }"
            >
              {{ row.name }}
            </RouterLink>
          </template>
          <template #cell-access="{ row }"
            ><AccessBadge :access="row.access" variant="inline"
          /></template>
          <template #cell-status="{ row }">
            <StatusBadge :tone="TEMPLATE_STATUS_TONE[row.status]" :label="row.status" />
          </template>
          <template #cell-updated_at="{ row }">{{ formatRelativeTime(row.updated_at) }}</template>
          <template #cell-actions="{ row }">
            <TemplateActionMenu
              :template="row"
              :disabled="busyId === row.id"
              @action="(a) => onAction(row, a)"
            />
          </template>
        </ResponsiveTable>

        <PaginationBar
          :page="list.page.value"
          :limit="ADMIN_PAGE_SIZE"
          :total="list.total.value"
          @update:page="list.setPage"
        />
      </template>
    </div>

    <TemplateCreateDialog :open="createOpen" @close="createOpen = false" @created="onCreated" />

    <TemplateArchiveDialog
      :open="archiveTarget !== null"
      :template="archiveTarget"
      :busy="dialogBusy"
      :error="dialogError"
      @close="archiveTarget = null"
      @confirm="confirmArchive"
    />

    <ConfirmTypeDialog
      :open="deleteTarget !== null"
      :title="`Hapus “${deleteTarget?.name ?? ''}” permanen?`"
      description="Template, semua halaman, dan riwayat versinya akan dihapus. Tindakan ini tidak bisa dibatalkan."
      :expected="deleteTarget?.name ?? ''"
      confirm-label="Hapus permanen"
      :busy="dialogBusy"
      :blocked="(deleteTarget?.in_use_count ?? 0) > 0"
      :error="dialogError"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    >
      <p v-if="deleteTarget && deleteTarget.in_use_count > 0" class="nk-note nk-note--warning">
        <NkIcon name="alert-triangle" :size="16" />
        Dipakai oleh {{ formatNumber(deleteTarget.in_use_count) }} undangan. Template yang dipakai
        undangan hanya bisa diarsipkan.
        <button type="button" class="nk-linkbtn" @click="archiveInstead">
          Arsipkan sebagai gantinya
        </button>
      </p>
      <p v-else class="nk-note nk-note--success">
        <NkIcon name="check-circle" :size="16" />Tidak dipakai undangan mana pun
      </p>
    </ConfirmTypeDialog>
  </AppShellLayout>
</template>
