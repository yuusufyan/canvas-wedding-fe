import type { InvitationPage, TemplateAccess } from './invitation-document'

// Draf kontrak admin template dan membership (TODO(BE): endpoint belum ada; bentuk akan
// disamakan dengan Swagger backend).
export type TemplateStatus = 'Terbit' | 'Draft' | 'Arsip'

export interface AdminTemplate {
  id: string
  slug: string
  name: string
  access: TemplateAccess
  status: TemplateStatus
  page_count: number
  /** Jumlah undangan aktif yang memakai template ini. */
  in_use_count: number
  updated_at: string
  cover: InvitationPage
}

export interface TemplateCounts {
  all: number
  published: number
  draft: number
  archived: number
}

export type TemplateSort = 'updated_desc' | 'name_asc'

export interface TemplateListParams {
  page: number
  limit: number
  status?: TemplateStatus
  access?: TemplateAccess
  q?: string
  sort?: TemplateSort
}

export interface CreateTemplateRequest {
  name: string
  access: TemplateAccess
}

export interface UpdateTemplateRequest {
  name?: string
  access?: TemplateAccess
}

export type MembershipPlan = 'Premium' | 'Gratis'
export type MembershipStatus = 'Aktif' | 'Trial' | 'Segera berakhir' | 'Kedaluwarsa'

export interface Membership {
  id: string
  user_name: string
  /** Sudah tersamar oleh backend (mis. n***@contoh.test). */
  email: string
  plan: MembershipPlan
  status: MembershipStatus
  expires_at: string | null
  invitations_used: number
  invitations_quota: number
}

export interface MembershipSummary {
  total: number
  active: number
  trial: number
  trial_expiring_soon: number
  expiring_soon: number
  expired: number
}

export interface MembershipListParams {
  page: number
  limit: number
  status?: MembershipStatus
  q?: string
}
