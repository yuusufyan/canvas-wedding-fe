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
import { mapAdminTemplate, toApiAccess, toApiStatus, type RawAdminTemplate } from './templateMapper'

export async function listTemplates(
  params: TemplateListParams,
): Promise<PaginatedResult<AdminTemplate>> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    status: toApiStatus(params.status),
    access: toApiAccess(params.access),
    q: params.q,
    sort: params.sort,
  })
  const result = await apiRequestPaginated<RawAdminTemplate>(`/templates${query}`, {
    method: 'GET',
  })
  return {
    ...result,
    data: result.data.map(mapAdminTemplate),
  }
}

export function getTemplateCounts(): Promise<TemplateCounts> {
  return apiRequest<TemplateCounts>('/templates/counts', { method: 'GET' })
}

export async function createTemplate(body: CreateTemplateRequest): Promise<AdminTemplate> {
  const raw = await apiRequest<RawAdminTemplate>('/templates', {
    method: 'POST',
    body: { ...body, access: toApiAccess(body.access) },
  })
  return mapAdminTemplate(raw)
}

export async function updateTemplate(
  id: string,
  body: UpdateTemplateRequest,
): Promise<AdminTemplate> {
  const raw = await apiRequest<RawAdminTemplate>(`/templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.access !== undefined ? { access: toApiAccess(body.access) } : {}),
    },
  })
  return mapAdminTemplate(raw)
}

export async function publishTemplate(id: string): Promise<AdminTemplate> {
  const raw = await apiRequest<RawAdminTemplate>(`/templates/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  })
  return mapAdminTemplate(raw)
}

export async function archiveTemplate(id: string): Promise<AdminTemplate> {
  const raw = await apiRequest<RawAdminTemplate>(`/templates/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
  return mapAdminTemplate(raw)
}

export function deleteTemplate(id: string): Promise<null> {
  return apiRequest<null>(`/templates/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
