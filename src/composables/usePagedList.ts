import { computed, ref, shallowRef, watch } from 'vue'
import type { PaginatedResult, PaginationMeta } from '@/types/api'
import { statusFromError, type AsyncStatus } from './useAsyncState'

interface PagedListOptions<T, F> {
  /** Filter aktif; berubah memicu muat ulang dari halaman 1. */
  filters: () => F
  fetcher: (params: F & { page: number; limit: number }) => Promise<PaginatedResult<T>>
  limit: number
}

// List dengan paginasi server: status muat, halaman, dan hasil terbaru saja yang dipakai.
export function usePagedList<T, F>(options: PagedListOptions<T, F>) {
  const status = ref<AsyncStatus>('idle')
  const items = shallowRef<T[]>([])
  const meta = shallowRef<PaginationMeta | null>(null)
  const page = ref(1)
  let requestId = 0

  async function load(): Promise<void> {
    const id = ++requestId
    status.value = 'loading'
    try {
      const result = await options.fetcher({
        ...options.filters(),
        page: page.value,
        limit: options.limit,
      })
      if (id !== requestId) {
        return
      }
      items.value = result.data
      meta.value = result.meta
      status.value = 'ready'
    } catch (error) {
      if (id !== requestId) {
        return
      }
      items.value = []
      status.value = statusFromError(error)
    }
  }

  function setPage(next: number): void {
    page.value = Math.max(1, next)
    void load()
  }

  // Filter berubah: kembali ke halaman 1.
  watch(
    () => JSON.stringify(options.filters()),
    () => {
      page.value = 1
      void load()
    },
  )

  const total = computed(() => meta.value?.total ?? 0)
  const isEmpty = computed(() => status.value === 'ready' && items.value.length === 0)

  return { status, items, meta, page, total, isEmpty, load, setPage }
}
