import { ref, shallowRef } from 'vue'
import { ApiError } from '@/api/http'

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'not-found' | 'error'

// Status muat satu sumber data: loading, ready, not-found (404), error. Pesan error
// tidak dibawa; tampilan memakai teks generik.
export function useAsyncState<T>(loader: () => Promise<T>) {
  const status = ref<AsyncStatus>('idle')
  const data = shallowRef<T | null>(null)
  let requestId = 0

  async function load(): Promise<void> {
    const id = ++requestId
    status.value = 'loading'
    try {
      const result = await loader()
      if (id !== requestId) {
        return
      }
      data.value = result
      status.value = 'ready'
    } catch (error) {
      if (id !== requestId) {
        return
      }
      data.value = null
      status.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error'
    }
  }

  return { status, data, load }
}
