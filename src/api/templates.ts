import type { PaginatedResult } from '@/types/api'
import type {
  AdminTemplate,
  CreateTemplateRequest,
  TemplateCounts,
  TemplateListParams,
  UpdateTemplateRequest,
} from '@/types/admin'
import { apiRequest, apiRequestPaginated } from './http'
import { buildQuery } from './query'

// TODO(BE): endpoint template (SuperAdmin) belum ada; kontrak masih draf dan dilayani
// src/api/mock saat dev.
export function listTemplates(params: TemplateListParams): Promise<PaginatedResult<AdminTemplate>> {
  return apiRequestPaginated<AdminTemplate>(`/templates${buildQuery({ ...params })}`, {
    method: 'GET',
  })
}

export function getTemplateCounts(): Promise<TemplateCounts> {
  return apiRequest<TemplateCounts>('/templates/counts', { method: 'GET' })
}

export function createTemplate(body: CreateTemplateRequest): Promise<AdminTemplate> {
  return apiRequest<AdminTemplate>('/templates', { method: 'POST', body })
}

export function updateTemplate(id: string, body: UpdateTemplateRequest): Promise<AdminTemplate> {
  return apiRequest<AdminTemplate>(`/templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
}

export function publishTemplate(id: string): Promise<AdminTemplate> {
  return apiRequest<AdminTemplate>(`/templates/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  })
}

export function archiveTemplate(id: string): Promise<AdminTemplate> {
  return apiRequest<AdminTemplate>(`/templates/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}

export function deleteTemplate(id: string): Promise<null> {
  return apiRequest<null>(`/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
