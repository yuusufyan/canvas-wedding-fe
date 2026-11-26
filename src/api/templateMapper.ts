import type { AdminTemplate, TemplateStatus } from '@/types/admin'
import type {
  InvitationDocument,
  InvitationElement,
  InvitationPage,
  TemplateAccess,
} from '@/types/invitation-document'
import type { PublicTemplateSummary, TemplateDemo } from '@/types/template'

export type ApiTemplateAccess = 'gratis' | 'premium' | TemplateAccess
export type ApiTemplateStatus = 'published' | 'draft' | 'archived' | TemplateStatus

const ACCESS_TO_API: Record<TemplateAccess, 'gratis' | 'premium'> = {
  Gratis: 'gratis',
  Premium: 'premium',
}

const STATUS_TO_API: Record<TemplateStatus, 'published' | 'draft' | 'archived'> = {
  Terbit: 'published',
  Draft: 'draft',
  Arsip: 'archived',
}

export function toApiAccess(access?: TemplateAccess): 'gratis' | 'premium' | undefined {
  return access ? ACCESS_TO_API[access] : undefined
}

export function toApiStatus(
  status?: TemplateStatus,
): 'published' | 'draft' | 'archived' | undefined {
  return status ? STATUS_TO_API[status] : undefined
}

export function fromApiAccess(access: string): TemplateAccess {
  return access.toLowerCase() === 'premium' ? 'Premium' : 'Gratis'
}

export function fromApiStatus(status: string): TemplateStatus {
  const normalized = status.toLowerCase()
  if (normalized === 'published' || normalized === 'terbit') return 'Terbit'
  if (normalized === 'archived' || normalized === 'arsip') return 'Arsip'
  return 'Draft'
}

type RawElement = InvitationElement & {
  lineHeight?: number
  letterSpacing?: number
}

function mapElement(raw: RawElement): InvitationElement {
  if (raw.type !== 'text') return raw
  return {
    ...raw,
    line_height: raw.line_height ?? raw.lineHeight,
    letter_spacing: raw.letter_spacing ?? raw.letterSpacing,
  }
}

export function mapPage(raw: InvitationPage): InvitationPage {
  return {
    ...raw,
    elements: (raw.elements ?? []).map((el) => mapElement(el as RawElement)),
  }
}

type RawDocument = {
  schemaVersion?: 1
  schema_version?: 1
  pages: InvitationPage[]
}

export function mapDocument(raw: RawDocument): InvitationDocument {
  return {
    schema_version: raw.schema_version ?? raw.schemaVersion ?? 1,
    pages: (raw.pages ?? []).map(mapPage),
  }
}

export interface RawPublicTemplateSummary {
  slug: string
  name: string
  access: ApiTemplateAccess
  cover: InvitationPage
}

export function mapPublicTemplateSummary(raw: RawPublicTemplateSummary): PublicTemplateSummary {
  return {
    slug: raw.slug,
    name: raw.name,
    access: fromApiAccess(raw.access),
    cover: mapPage(raw.cover),
  }
}

export interface RawTemplateDemo {
  slug: string
  name: string
  coupleLabel?: string
  couple_label?: string
  access: ApiTemplateAccess
  description: string
  durationSeconds?: number
  duration_seconds?: number
  animationLabel?: string | null
  animation_label?: string | null
  hasMusic?: boolean
  has_music?: boolean
  hasRsvp?: boolean
  has_rsvp?: boolean
  document: RawDocument
}

export function mapTemplateDemo(raw: RawTemplateDemo): TemplateDemo {
  return {
    slug: raw.slug,
    name: raw.name,
    couple_label: raw.couple_label ?? raw.coupleLabel ?? '',
    access: fromApiAccess(raw.access),
    description: raw.description ?? '',
    duration_seconds: raw.duration_seconds ?? raw.durationSeconds ?? 40,
    animation_label: raw.animation_label ?? raw.animationLabel ?? null,
    has_music: raw.has_music ?? raw.hasMusic ?? false,
    has_rsvp: raw.has_rsvp ?? raw.hasRsvp ?? false,
    document: mapDocument(raw.document),
  }
}

export interface RawAdminTemplate {
  id: string
  slug: string
  name: string
  access: ApiTemplateAccess
  status: ApiTemplateStatus
  pageCount?: number
  page_count?: number
  inUseCount?: number
  in_use_count?: number
  updatedAt?: string
  updated_at?: string
  cover: InvitationPage
}

export function mapAdminTemplate(raw: RawAdminTemplate): AdminTemplate {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    access: fromApiAccess(raw.access),
    status: fromApiStatus(raw.status),
    page_count: raw.page_count ?? raw.pageCount ?? 0,
    in_use_count: raw.in_use_count ?? raw.inUseCount ?? 0,
    updated_at: raw.updated_at ?? raw.updatedAt ?? '',
    cover: mapPage(raw.cover),
  }
}
