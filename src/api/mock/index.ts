import { API_BASE_PATH } from '@/constants/api'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import { mockTemplateDemo, mockTemplateSummaries } from './templates'

// Mode uji manual/E2E: window.__nkMock = 'empty' | 'error' | 'slow' (hanya ada saat dev + mock).
declare global {
  interface Window {
    __nkMock?: 'empty' | 'error' | 'slow'
  }
}

const PUBLIC_TEMPLATES = `${API_BASE_PATH}/public/templates`
const DEFAULT_DELAY_MS = 250
const SLOW_DELAY_MS = 4000

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function envelope<T>(data: T, meta?: PaginationMeta): ApiEnvelope<T> {
  return { code: 200, status: 'OK', message: 'OK', data, meta }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function handlePublicTemplates(url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith(PUBLIC_TEMPLATES)) {
    return null
  }
  const mode = window.__nkMock
  await wait(mode === 'slow' ? SLOW_DELAY_MS : DEFAULT_DELAY_MS)
  if (mode === 'error') {
    return json(500, { code: 500, status: 'error', message: 'Internal Server Error' })
  }

  const rest = url.pathname.slice(PUBLIC_TEMPLATES.length)
  if (rest === '' || rest === '/') {
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const items = mode === 'empty' ? [] : mockTemplateSummaries(limit)
    const meta: PaginationMeta = {
      total: items.length,
      page: 1,
      limit,
      total_pages: items.length === 0 ? 0 : 1,
      total_results: items.length,
    }
    return json(200, envelope(items, meta))
  }

  const match = /^\/([^/]+)\/demo$/.exec(rest)
  const demo = match?.[1] ? mockTemplateDemo(decodeURIComponent(match[1])) : null
  if (!demo || mode === 'empty') {
    return json(404, { code: 404, status: 'error', message: 'Not Found' })
  }
  return json(200, envelope(demo))
}

// Menimpa fetch peramban hanya untuk endpoint yang belum ada di backend; sisanya diteruskan.
export function installMockApi(): void {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const raw = input instanceof Request ? input.url : String(input)
    const url = new URL(raw, window.location.origin)
    const mocked = await handlePublicTemplates(url)
    return mocked ?? realFetch(input, init)
  }
}
