import type {
  ActivityEvent,
  InvitationStats,
  RegistrationWeek,
  TopTemplate,
} from '@/types/dashboard'
import { apiRequest } from './http'

// TODO(BE): endpoint dashboard (SuperAdmin) belum ada; kontrak masih draf dan dilayani src/api/mock.
// Jumlah pengguna, template, dan membership memakai modul yang sudah ada (users, templates, memberships).
export function getInvitationStats(): Promise<InvitationStats> {
  return apiRequest<InvitationStats>('/dashboard/invitations', { method: 'GET' })
}

export function getRegistrationTrend(): Promise<RegistrationWeek[]> {
  return apiRequest<RegistrationWeek[]>('/dashboard/registrations', { method: 'GET' })
}

export function getTopTemplates(): Promise<TopTemplate[]> {
  return apiRequest<TopTemplate[]>('/dashboard/top-templates', { method: 'GET' })
}

type RawActivityEvent = Omit<ActivityEvent, 'occurred_at'> & {
  occurredAt?: string
  occurred_at?: string
}

export async function getRecentActivity(): Promise<ActivityEvent[]> {
  const rows = await apiRequest<RawActivityEvent[]>('/dashboard/activity', { method: 'GET' })
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    message: row.message,
    occurred_at: row.occurred_at ?? row.occurredAt ?? '',
  }))
}
