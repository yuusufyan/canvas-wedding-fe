import type { PaginatedResult } from '@/types/api'
import type { Membership, MembershipListParams, MembershipSummary } from '@/types/admin'
import { apiRequest, apiRequestPaginated } from './http'
import { buildQuery } from './query'

// TODO(BE): endpoint membership (SuperAdmin) belum ada; kontrak masih draf dan dilayani
// src/api/mock saat dev.
export function listMemberships(
  params: MembershipListParams,
): Promise<PaginatedResult<Membership>> {
  return apiRequestPaginated<Membership>(`/memberships${buildQuery({ ...params })}`, {
    method: 'GET',
  })
}

export function getMembershipSummary(): Promise<MembershipSummary> {
  return apiRequest<MembershipSummary>('/memberships/summary', { method: 'GET' })
}
