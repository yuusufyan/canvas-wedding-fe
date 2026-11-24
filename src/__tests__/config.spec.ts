import { afterEach, describe, expect, it, vi } from 'vitest'

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('TC-UI-F2-06: mock API mati secara default dan hanya menyala dengan flag di mode dev', async () => {
    vi.stubEnv('VITE_USE_MOCK_API', '')
    vi.resetModules()
    expect((await import('../config')).loadMockApi).toBeNull()

    vi.stubEnv('VITE_USE_MOCK_API', 'true')
    vi.resetModules()
    expect((await import('../config')).loadMockApi).toBeTypeOf('function')

    vi.stubEnv('DEV', false)
    vi.resetModules()
    expect((await import('../config')).loadMockApi).toBeNull()
  })

  async function loadApiBaseUrl(env: string): Promise<string> {
    vi.stubEnv('VITE_API_BASE_URL', env)
    vi.resetModules()
    return (await import('../config')).apiBaseUrl
  }

  it('apiBaseUrl memakai VITE_API_BASE_URL dan membuang slash di akhir', async () => {
    expect(await loadApiBaseUrl('https://api.contoh.test')).toBe('https://api.contoh.test')
    expect(await loadApiBaseUrl('https://api.contoh.test///')).toBe('https://api.contoh.test')
  })

  it('apiBaseUrl: tanpa env, dev memakai http://localhost:3000', async () => {
    expect(await loadApiBaseUrl('')).toBe('http://localhost:3000')
  })

  it('apiBaseUrl: tanpa env, build produksi kosong (URL relatif)', async () => {
    vi.stubEnv('DEV', false)
    expect(await loadApiBaseUrl('')).toBe('')
  })

  it('constants/api menurunkan origin dan path dasar dari apiBaseUrl', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.contoh.test/v2/')
    vi.resetModules()
    const api = await import('../constants/api')
    expect(api.API_BASE_URL).toBe('https://api.contoh.test/v2')
    expect(api.API_ORIGIN).toBe('https://api.contoh.test')
    expect(api.API_BASE_PATH).toBe('/v2')

    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000')
    vi.resetModules()
    expect((await import('../constants/api')).API_BASE_PATH).toBe('')
  })
})
