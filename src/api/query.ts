const MAX_LIMIT = 100

type QueryValue = string | number | undefined

// Query string untuk list: page minimal 1, limit dibatasi 1..100, nilai kosong dibuang.
export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue
    }
    if (key === 'page') {
      search.set(key, String(Math.max(1, Number(value))))
    } else if (key === 'limit') {
      search.set(key, String(Math.min(MAX_LIMIT, Math.max(1, Number(value)))))
    } else {
      search.set(key, String(value))
    }
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}
