import type { PaginatedResult } from '@/types/api'
import type { PublicTemplateSummary, TemplateDemo } from '@/types/template'
import { apiRequest, apiRequestPaginated } from './http'

// TODO(BE): endpoint publik belum ada; bentuknya masih draf dan dilayani src/api/mock saat dev.
export function listPublicTemplates(limit = 4): Promise<PaginatedResult<PublicTemplateSummary>> {
  return apiRequestPaginated<PublicTemplateSummary>(`/public/templates?page=1&limit=${limit}`, {
    method: 'GET',
    skipAuth: true,
  })
}

export function getTemplateDemo(slug: string): Promise<TemplateDemo> {
  return apiRequest<TemplateDemo>(`/public/templates/${encodeURIComponent(slug)}/demo`, {
    method: 'GET',
    skipAuth: true,
  })
}
