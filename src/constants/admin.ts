import type { MembershipStatus, TemplateStatus } from '@/types/admin'
import type { TemplateAccess } from '@/types/invitation-document'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const TEMPLATE_STATUSES: readonly TemplateStatus[] = ['Terbit', 'Draft', 'Arsip']
export const TEMPLATE_ACCESSES: readonly TemplateAccess[] = ['Gratis', 'Premium']

export const TEMPLATE_STATUS_TONE: Record<TemplateStatus, StatusTone> = {
  Terbit: 'success',
  Draft: 'warning',
  Arsip: 'neutral',
}

export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = [
  'Aktif',
  'Trial',
  'Segera berakhir',
  'Kedaluwarsa',
]

export const MEMBERSHIP_STATUS_TONE: Record<MembershipStatus, StatusTone> = {
  Aktif: 'success',
  Trial: 'info',
  'Segera berakhir': 'warning',
  Kedaluwarsa: 'danger',
}

export const TEMPLATE_NAME_MAX = 60
export const ADMIN_PAGE_SIZE = 12
export const ADMIN_TABLE_PAGE_SIZE = 10
