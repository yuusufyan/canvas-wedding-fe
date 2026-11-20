import type { InvitationDocument, InvitationPage, TemplateAccess } from './invitation-document'

// `data` item untuk GET /public/templates (TODO(BE): kontrak belum ada).
export interface PublicTemplateSummary {
  slug: string
  name: string
  access: TemplateAccess
  cover: InvitationPage
}

// `data` untuk GET /public/templates/:slug/demo (TODO(BE): kontrak belum ada).
export interface TemplateDemo {
  slug: string
  name: string
  couple_label: string
  access: TemplateAccess
  description: string
  duration_seconds: number
  animation_label: string | null
  has_music: boolean
  has_rsvp: boolean
  document: InvitationDocument
}
