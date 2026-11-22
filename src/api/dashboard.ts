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

// TODO(BE): audit_trails sudah ada di database tetapi belum punya endpoint baca.
export function getRecentActivity(): Promise<ActivityEvent[]> {
  return apiRequest<ActivityEvent[]>('/dashboard/activity', { method: 'GET' })
}
