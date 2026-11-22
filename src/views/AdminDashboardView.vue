<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  getInvitationStats,
  getRecentActivity,
  getRegistrationTrend,
  getTopTemplates,
} from '@/api/dashboard'
import { getMembershipSummary, listMemberships } from '@/api/memberships'
import { getTemplateCounts } from '@/api/templates'
import { listUsers } from '@/api/users'
import NkIcon from '@/components/NkIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { NkIconName } from '@/constants/nk-icons'
import { useAsyncState } from '@/composables/useAsyncState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import type { ActivityKind } from '@/types/dashboard'
import { formatDate } from '@/utils/format'
import { maskEmail } from '@/utils/mask'
import { formatNumber, formatRelativeTime } from '@/utils/relative-time'
import DashCard from './dashboard/DashCard.vue'
import DashStat from './dashboard/DashStat.vue'

useDocumentTitle('Dashboard')

const EXPIRING_LIMIT = 3

// Pengguna: data nyata dari /users (hanya total). Template, undangan, membership, tren, template
// terpopuler, dan aktivitas masih draf/mocks sampai endpoint BE ada (TODO(BE), lihat src/api).
const users = useAsyncState(async () => (await listUsers({ page: 1, limit: 1 })).meta.total)
const templates = useAsyncState(getTemplateCounts)
const invitations = useAsyncState(getInvitationStats)
const memberSummary = useAsyncState(getMembershipSummary)
const trend = useAsyncState(getRegistrationTrend)
const top = useAsyncState(getTopTemplates)
const expiring = useAsyncState(
  async () =>
    (await listMemberships({ page: 1, limit: EXPIRING_LIMIT, status: 'Segera berakhir' })).data,
)
const activity = useAsyncState(getRecentActivity)

const sources = [users, templates, invitations, memberSummary, trend, top, expiring, activity]
onMounted(() => sources.forEach((source) => void source.load()))

const today = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())

const trendTotal = computed(() => (trend.data.value ?? []).reduce((sum, w) => sum + w.count, 0))
const trendMax = computed(() => Math.max(1, ...(trend.data.value ?? []).map((w) => w.count)))
const topMax = computed(() => Math.max(1, ...(top.data.value ?? []).map((t) => t.invitations)))

const ACTIVITY_ICONS: Record<ActivityKind, { icon: NkIconName; tone: string }> = {
  login_failed: { icon: 'shield', tone: 'danger' },
  permission_changed: { icon: 'sliders', tone: 'brand' },
  template_archived: { icon: 'archive', tone: 'neutral' },
  user_created: { icon: 'user-plus', tone: 'success' },
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <header class="nk-page__head">
        <div>
          <h1 class="nk-page__title">Dashboard</h1>
          <p class="nk-page__lead">Ringkasan sistem · {{ today }}</p>
        </div>
      </header>

      <ul class="nk-statgrid" aria-label="Ringkasan utama">
        <li>
          <DashStat
            label="Pengguna"
            icon="users"
            :status="users.status.value"
            :value="formatNumber(users.data.value ?? 0)"
            note="Total akun terdaftar"
            @retry="users.load"
          />
        </li>
        <li>
          <DashStat
            label="Template terbit"
            icon="layout"
            :status="templates.status.value"
            :value="formatNumber(templates.data.value?.published ?? 0)"
            :note="`${formatNumber(templates.data.value?.draft ?? 0)} draft · ${formatNumber(templates.data.value?.archived ?? 0)} arsip`"
            tone="muted"
            @retry="templates.load"
          />
        </li>
        <li>
          <DashStat
            label="Undangan aktif"
            icon="mail"
            :status="invitations.status.value"
            :value="formatNumber(invitations.data.value?.invitations_active ?? 0)"
            :note="`+${formatNumber(invitations.data.value?.invitations_new_30d ?? 0)} dalam 30 hari`"
            tone="success"
            @retry="invitations.load"
          />
        </li>
        <li>
          <DashStat
            label="Member Premium"
            icon="crown"
            :status="memberSummary.status.value"
            :value="formatNumber(memberSummary.data.value?.active ?? 0)"
            :note="`${formatNumber(memberSummary.data.value?.expiring_soon ?? 0)} berakhir ≤ 7 hari`"
            tone="warning"
            @retry="memberSummary.load"
          />
        </li>
      </ul>

      <div class="nk-dashgrid">
        <DashCard
          title="Pendaftaran pengguna"
          subtitle="Per minggu, 5 minggu terakhir"
          :status="trend.status.value"
          :empty="(trend.data.value ?? []).length === 0"
          empty-text="Belum ada pendaftaran."
          @retry="trend.load"
        >
          <template #meta>
            <span class="nk-card__total">Total {{ formatNumber(trendTotal) }}</span>
          </template>
          <ul class="nk-bars" aria-label="Pendaftaran per minggu">
            <li v-for="week in trend.data.value" :key="week.label" class="nk-bars__item">
              <span class="nk-bars__value">{{ formatNumber(week.count) }}</span>
              <span class="nk-bars__track">
                <span
                  class="nk-bars__bar"
                  :class="{ 'is-peak': week.count === trendMax }"
                  :style="{ height: `${(week.count / trendMax) * 100}%` }"
                ></span>
              </span>
              <span class="nk-bars__label">{{ week.label }}</span>
            </li>
          </ul>
        </DashCard>

        <DashCard
          title="Template terpopuler"
          :status="top.status.value"
          :empty="(top.data.value ?? []).length === 0"
          empty-text="Belum ada template yang dipakai."
          link-label="Lihat semua"
          :to="{ name: 'admin-templates' }"
          @retry="top.load"
        >
          <ul class="nk-hbars">
            <li v-for="item in top.data.value" :key="item.name">
              <div class="nk-hbars__row">
                <span class="nk-hbars__name">{{ item.name }}</span>
                <span class="nk-hbars__value">{{ formatNumber(item.invitations) }} undangan</span>
              </div>
              <span class="nk-hbars__track" aria-hidden="true">
                <span
                  class="nk-hbars__fill"
                  :style="{ width: `${(item.invitations / topMax) * 100}%` }"
                ></span>
              </span>
            </li>
          </ul>
        </DashCard>

        <DashCard
          title="Membership segera berakhir"
          :status="expiring.status.value"
          :empty="(expiring.data.value ?? []).length === 0"
          empty-text="Tidak ada membership yang segera berakhir."
          link-label="Lihat semua"
          :to="{ name: 'admin-membership' }"
          @retry="expiring.load"
        >
          <ul class="nk-simplelist">
            <li v-for="member in expiring.data.value" :key="member.id" class="nk-simplelist__row">
              <div class="nk-person">
                <span class="nk-person__avatar" aria-hidden="true">{{
                  initial(member.user_name)
                }}</span>
                <span class="nk-person__text">
                  <strong>{{ member.user_name }}</strong>
                  <small>{{ maskEmail(member.email) }}</small>
                </span>
              </div>
              <StatusBadge
                tone="warning"
                :label="member.expires_at ? formatDate(member.expires_at) : '—'"
              />
            </li>
          </ul>
        </DashCard>

        <DashCard
          title="Aktivitas terbaru"
          :status="activity.status.value"
          :empty="(activity.data.value ?? []).length === 0"
          empty-text="Belum ada aktivitas."
          @retry="activity.load"
        >
          <ul class="nk-simplelist">
            <li v-for="event in activity.data.value" :key="event.id" class="nk-activity">
              <span
                class="nk-activity__icon"
                :class="`is-${ACTIVITY_ICONS[event.kind].tone}`"
                aria-hidden="true"
              >
                <NkIcon :name="ACTIVITY_ICONS[event.kind].icon" :size="16" />
              </span>
              <span class="nk-person__text">
                <strong>{{ event.message }}</strong>
                <small>{{ formatRelativeTime(event.occurred_at) }}</small>
              </span>
            </li>
          </ul>
        </DashCard>
      </div>
    </div>
  </AppShellLayout>
</template>
