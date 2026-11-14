// Envelope shape produced by the backend's nest-common TransformInterceptor
// for every response, success or error.
export interface ApiEnvelope<T> {
  code: number
  status: string
  message: string
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface DeletedIdResponse {
  id: string
}
