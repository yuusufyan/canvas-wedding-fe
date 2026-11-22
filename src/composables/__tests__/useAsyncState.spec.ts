import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/http'
import { useAsyncState } from '../useAsyncState'

describe('useAsyncState', () => {
  it('TC-UI-F2-29: sukses mengisi data dan status ready', async () => {
    const { status, data, load } = useAsyncState(async () => ['a'])
    expect(status.value).toBe('idle')

    const pending = load()
    expect(status.value).toBe('loading')
    await pending

    expect(status.value).toBe('ready')
    expect(data.value).toEqual(['a'])
  })

  it('TC-UI-F2-30: 404 menjadi not-found dan kegagalan lain menjadi error', async () => {
    const notFound = useAsyncState(async () => Promise.reject(new ApiError(404)))
    await notFound.load()
    expect(notFound.status.value).toBe('not-found')
    expect(notFound.data.value).toBeNull()

    const failed = useAsyncState(async () => Promise.reject(new ApiError(500)))
    await failed.load()
    expect(failed.status.value).toBe('error')
  })

  it('TC-UI-F2-31: hasil permintaan lama tidak menimpa permintaan terbaru', async () => {
    let calls = 0
    const resolvers: Array<(value: string) => void> = []
    const { data, status, load } = useAsyncState(
      () =>
        new Promise<string>((resolve) => {
          calls += 1
          resolvers.push(resolve)
        }),
    )

    const first = load()
    const second = load()
    resolvers[1]?.('baru')
    await second
    resolvers[0]?.('lama')
    await first

    expect(calls).toBe(2)
    expect(data.value).toBe('baru')
    expect(status.value).toBe('ready')
  })
})
