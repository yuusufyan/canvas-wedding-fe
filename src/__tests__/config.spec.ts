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
})
