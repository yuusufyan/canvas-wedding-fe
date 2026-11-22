<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getMembershipSummary, listMemberships } from '@/api/memberships'
import AccessBadge from '@/components/AccessBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import FilterChips, { type ChipOption } from '@/components/FilterChips.vue'
import NkIcon from '@/components/NkIcon.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import ResponsiveTable, { type TableColumn } from '@/components/ResponsiveTable.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { ADMIN_TABLE_PAGE_SIZE, MEMBERSHIP_STATUS_TONE } from '@/constants/admin'
import { useAsyncState } from '@/composables/useAsyncState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { usePagedList } from '@/composables/usePagedList'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import type { Membership, MembershipStatus } from '@/types/admin'
import { formatDate } from '@/utils/format'
import { maskEmail } from '@/utils/mask'
import { formatNumber } from '@/utils/relative-time'

useDocumentTitle('Membership')

const SEARCH_DEBOUNCE_MS = 300

const status = ref<MembershipStatus | ''>('')
const searchText = ref('')
const query = ref('')

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchText, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (query.value = value.trim()), SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const list = usePagedList({
  limit: ADMIN_TABLE_PAGE_SIZE,
  filters: () => ({ status: status.value || undefined, q: query.value || undefined }),
  fetcher: listMemberships,
})
const summary = useAsyncState(getMembershipSummary)

onMounted(() => {
  void list.load()
  void summary.load()
})

const statusOptions = computed<ChipOption<MembershipStatus>[]>(() => {
  const s = summary.data.value
  const count = (n: number | undefined) => (s ? formatNumber(n ?? 0) : undefined)
  return [
    { value: '', label: 'Semua', count: count(s?.total) },
    { value: 'Aktif', label: 'Aktif', count: count(s?.active) },
    { value: 'Trial', label: 'Trial', count: count(s?.trial) },
    { value: 'Segera berakhir', label: 'Segera berakhir', count: count(s?.expiring_soon) },
    { value: 'Kedaluwarsa', label: 'Kedaluwarsa', count: count(s?.expired) },
  ]
})

const stats = computed(() => {
  const s = summary.data.value
  if (!s) {
    return []
  }
  return [
    {
      label: 'Member aktif',
      value: formatNumber(s.active),
      note: 'Premium berjalan',
      tone: 'success' as const,
    },
    {
      label: 'Trial',
      value: formatNumber(s.trial),
      note: `Berakhir ≤ 7 hari: ${formatNumber(s.trial_expiring_soon)}`,
      tone: 'info' as const,
    },
    {
      label: 'Segera berakhir',
      value: formatNumber(s.expiring_soon),
      note: 'Dalam 7 hari ke depan',
      tone: 'warning' as const,
    },
    {
      label: 'Kedaluwarsa',
      value: formatNumber(s.expired),
      note: 'Sudah tidak aktif',
      tone: 'danger' as const,
    },
  ]
})

const hasFilters = computed(() => Boolean(status.value || query.value))

const columns: TableColumn[] = [
  { key: 'user_name', label: 'Pengguna', role: 'primary' },
  { key: 'plan', label: 'Paket', role: 'meta' },
  { key: 'status', label: 'Status', role: 'status' },
  { key: 'expires_at', label: 'Berlaku sampai', role: 'meta' },
  { key: 'invitations', label: 'Undangan', role: 'meta' },
]

function resetFilters(): void {
  status.value = ''
  searchText.value = ''
  query.value = ''
}

function initial(row: Membership): string {
  return row.user_name.trim().charAt(0).toUpperCase()
}

function isExpired(row: Membership): boolean {
  return row.status === 'Kedaluwarsa'
}
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <header class="nk-page__head">
        <div>
          <h1 class="nk-page__title">Membership</h1>
          <p class="nk-page__lead">
            Pantau paket dan masa berlaku pengguna. Paket menentukan template yang bisa dipakai.
          </p>
        </div>
      </header>

      <section aria-label="Ringkasan membership">
        <div v-if="summary.status.value === 'error'" class="nk-statgrid">
          <ErrorState title="Ringkasan belum bisa dimuat" @retry="summary.load" />
        </div>
        <ul v-else class="nk-statgrid">
          <template v-if="summary.status.value === 'ready'">
            <li v-for="stat in stats" :key="stat.label">
              <StatCard v-bind="stat" />
            </li>
          </template>
          <template v-else>
            <li v-for="n in 4" :key="n" aria-hidden="true">
              <div class="nk-skeleton nk-stat nk-stat--skeleton"></div>
            </li>
          </template>
        </ul>
      </section>

      <div class="nk-toolbar">
        <FilterChips v-model="status" label="Filter status membership" :options="statusOptions" />
        <div class="nk-toolbar__controls">
          <div class="nk-search">
            <NkIcon name="search" :size="16" />
            <label class="nk-visually-hidden" for="membership-search">Cari nama pengguna</label>
            <input
              id="membership-search"
              v-model="searchText"
              class="nk-input nk-input--search"
              type="search"
              placeholder="Cari nama pengguna"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <div
        v-if="list.status.value === 'loading' || list.status.value === 'idle'"
        data-testid="membership-loading"
        aria-busy="true"
      >
        <p class="nk-visually-hidden" role="status">Memuat membership…</p>
        <div class="nk-skeleton nk-table-skeleton" aria-hidden="true"></div>
      </div>

      <EmptyState
        v-else-if="list.status.value === 'forbidden'"
        title="Kamu tidak punya akses"
        message="Halaman ini hanya untuk SuperAdmin. Hubungi administrator bila kamu merasa seharusnya bisa membukanya."
      />

      <ErrorState
        v-else-if="list.status.value === 'error' || list.status.value === 'not-found'"
        title="Data membership belum bisa dimuat"
        @retry="list.load"
      />

      <EmptyState
        v-else-if="list.isEmpty.value && hasFilters"
        title="Tidak ada member untuk filter ini"
        message="Coba ubah kata kunci atau filter status."
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
        title="Belum ada member"
        message="Pengguna yang mendaftar akan muncul di sini beserta paket dan masa berlakunya."
      />

      <template v-else>
        <ResponsiveTable
          caption="Daftar membership pengguna"
          :columns="columns"
          :rows="list.items.value"
          :row-key="(row) => row.id"
        >
          <template #cell-user_name="{ row }">
            <div class="nk-person">
              <span class="nk-person__avatar" aria-hidden="true">{{ initial(row) }}</span>
              <span class="nk-person__text">
                <strong>{{ row.user_name }}</strong>
                <small>{{ maskEmail(row.email) }}</small>
              </span>
            </div>
          </template>
          <template #cell-plan="{ row }"
            ><AccessBadge :access="row.plan" variant="inline"
          /></template>
          <template #cell-status="{ row }">
            <StatusBadge :tone="MEMBERSHIP_STATUS_TONE[row.status]" :label="row.status" />
          </template>
          <template #cell-expires_at="{ row }">
            <span v-if="row.expires_at" :class="{ 'nk-danger-text': isExpired(row) }">{{
              formatDate(row.expires_at)
            }}</span>
            <span v-else aria-label="Tidak ada masa berlaku">&mdash;</span>
          </template>
          <template #cell-invitations="{ row }">
            {{ formatNumber(row.invitations_used) }} / {{ formatNumber(row.invitations_quota) }}
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
  </AppShellLayout>
</template>
