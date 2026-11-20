import { API_BASE_PATH } from '@/constants/api'
import { handleAdmin } from './admin'
import { handleAuth } from './auth'
import { fail, ok, paginate, wait, type MockHandler, type MockRequest } from './http'
import { mockTemplateDemo, mockTemplateSummaries } from './templates'

const PUBLIC_TEMPLATES = `${API_BASE_PATH}/public/templates`

const handlePublicTemplates: MockHandler = ({ url }) => {
  if (!url.pathname.startsWith(PUBLIC_TEMPLATES)) {
    return null
  }
  const mode = window.__nkMock
  if (mode === 'error') {
    return fail(500, 'Internal Server Error')
  }

  const rest = url.pathname.slice(PUBLIC_TEMPLATES.length)
  if (rest === '' || rest === '/') {
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const items = mode === 'empty' ? [] : mockTemplateSummaries(limit)
    return paginate(items, url, limit)
  }

  const match = /^\/([^/]+)\/demo$/.exec(rest)
  const demo = match?.[1] ? mockTemplateDemo(decodeURIComponent(match[1])) : null
  if (!demo || mode === 'empty') {
    return fail(404, 'Not Found')
  }
  return ok(demo)
}

const HANDLERS: MockHandler[] = [handleAuth, handleAdmin, handlePublicTemplates]

async function parseBody(init?: RequestInit): Promise<unknown> {
  if (typeof init?.body !== 'string') {
    return undefined
  }
  try {
    return JSON.parse(init.body)
  } catch {
    return undefined
  }
}

// Menimpa fetch peramban hanya untuk endpoint yang belum ada di backend; sisanya diteruskan.
export function installMockApi(): void {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const raw = input instanceof Request ? input.url : String(input)
    const request: MockRequest = {
      url: new URL(raw, window.location.origin),
      method: (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase(),
      headers: new Headers(init?.headers),
      body: await parseBody(init),
    }
    if (request.url.pathname.startsWith(API_BASE_PATH)) {
      if (window.__nkMock === 'network') {
        throw new TypeError('Failed to fetch')
      }
      for (const handler of HANDLERS) {
        const response = await handler(request)
        if (response) {
          await wait()
          return response
        }
      }
    }
    return realFetch(input, init)
  }
}
