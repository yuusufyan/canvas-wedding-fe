import type { PaginatedResult } from '@/types/api'
import type { PublicTemplateSummary, TemplateDemo } from '@/types/template'
import { apiRequest, apiRequestPaginated } from './http'
import {
  mapPublicTemplateSummary,
  mapTemplateDemo,
  type RawPublicTemplateSummary,
  type RawTemplateDemo,
} from './templateMapper'

export async function listPublicTemplates(
  limit = 4,
): Promise<PaginatedResult<PublicTemplateSummary>> {
  const result = await apiRequestPaginated<RawPublicTemplateSummary>(
    `/public/templates?page=1&limit=${limit}`,
    {
      method: 'GET',
      skipAuth: true,
    },
  )
  return {
    ...result,
    data: result.data.map(mapPublicTemplateSummary),
  }
}

export async function getTemplateDemo(slug: string): Promise<TemplateDemo> {
  const raw = await apiRequest<RawTemplateDemo>(
    `/public/templates/${encodeURIComponent(slug)}/demo`,
    {
      method: 'GET',
      skipAuth: true,
    },
  )
  return mapTemplateDemo(raw)
}
