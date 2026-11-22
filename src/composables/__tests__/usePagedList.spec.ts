import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { ApiError } from '@/api/http'
import type { PaginatedResult } from '@/types/api'
import { usePagedList } from '../usePagedList'

type Fetcher = (p: { q?: string; page: number; limit: number }) => Promise<PaginatedResult<string>>

function result(items: string[], total = items.length): PaginatedResult<string> {
  return { data: items, meta: { total, page: 1, limit: 2, total_pages: 1, total_results: total } }
}

function setup(
  fetcher: (p: { q?: string; page: number; limit: number }) => Promise<PaginatedResult<string>>,
) {
  const q = ref<string | undefined>(undefined)
  const scope = effectScope()
  const list = scope.run(() =>
    usePagedList({ limit: 2, filters: () => ({ q: q.value }), fetcher }),
  )!
  return { q, list, scope }
}

describe('usePagedList', () => {
  it('TC-UI-F3-16: memuat halaman dengan limit dan menyimpan total', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(result(['a', 'b'], 5))
    const { list, scope } = setup(fetcher)

    const pending = list.load()
    expect(list.status.value).toBe('loading')
    await pending

    expect(fetcher).toHaveBeenCalledWith({ q: undefined, page: 1, limit: 2 })
    expect(list.status.value).toBe('ready')
    expect(list.items.value).toEqual(['a', 'b'])
    expect(list.total.value).toBe(5)
    expect(list.isEmpty.value).toBe(false)
    scope.stop()
  })

  it('TC-UI-F3-17: filter berubah kembali ke halaman 1 dan memuat ulang', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(result(['a']))
    const { q, list, scope } = setup(fetcher)
    await list.load()
    list.setPage(3)
    expect(list.page.value).toBe(3)

    q.value = 'abc'
    await nextTick()

    expect(list.page.value).toBe(1)
    expect(fetcher).toHaveBeenLastCalledWith({ q: 'abc', page: 1, limit: 2 })
    scope.stop()
  })

  it('TC-UI-F3-18: hasil kosong, 403, dan kegagalan lain punya status sendiri', async () => {
    const empty = setup(vi.fn<Fetcher>().mockResolvedValue(result([])))
    await empty.list.load()
    expect(empty.list.isEmpty.value).toBe(true)

    const forbidden = setup(vi.fn<Fetcher>().mockRejectedValue(new ApiError(403)))
    await forbidden.list.load()
    expect(forbidden.list.status.value).toBe('forbidden')

    const failed = setup(vi.fn<Fetcher>().mockRejectedValue(new ApiError(500)))
    await failed.list.load()
    expect(failed.list.status.value).toBe('error')
    expect(failed.list.items.value).toEqual([])
    for (const s of [empty, forbidden, failed]) {
      s.scope.stop()
    }
  })

  it('TC-UI-F3-19: hasil permintaan lama tidak menimpa yang terbaru', async () => {
    const resolvers: Array<(value: PaginatedResult<string>) => void> = []
    const fetcher = vi.fn<Fetcher>(
      () => new Promise<PaginatedResult<string>>((resolve) => resolvers.push(resolve)),
    )
    const { list, scope } = setup(fetcher)

    const first = list.load()
    const second = list.load()
    resolvers[1]?.(result(['baru']))
    await second
    resolvers[0]?.(result(['lama']))
    await first

    expect(list.items.value).toEqual(['baru'])
    scope.stop()
  })

  it('TC-UI-F3-20: setPage tidak turun di bawah 1', async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(result(['a']))
    const { list, scope } = setup(fetcher)

    list.setPage(0)
    await nextTick()

    expect(list.page.value).toBe(1)
    scope.stop()
  })
})
