import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { authGuard } from '../guard'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn<typeof useAuthStore>(),
}))

function fakeRoute(
  name: string,
  isPublic: boolean,
  requireSuperAdmin?: boolean,
): RouteLocationNormalized {
  return {
    name,
    meta: { public: isPublic, requireSuperAdmin },
  } as unknown as RouteLocationNormalized
}

const fromStub = {} as RouteLocationNormalizedLoaded
const nextStub = vi.fn<() => void>() as unknown as NavigationGuardNext

function mockStore(
  isAuthenticated: boolean,
  bootstrap: () => Promise<void> = () => Promise.resolve(),
  isSuperAdmin: boolean = false,
) {
  vi.mocked(useAuthStore).mockReturnValue({
    isAuthenticated,
    isSuperAdmin,
    bootstrap,
    profile: isAuthenticated
      ? {
          id: 'u-1',
          name: 'User',
          email: 'user@example.com',
          role: { id: 'r', name: isSuperAdmin ? 'SuperAdmin' : 'User' },
          is_active: true,
        }
      : null,
  } as unknown as ReturnType<typeof useAuthStore>)
}

function runGuard(to: RouteLocationNormalized) {
  return Promise.resolve(authGuard.call(undefined, to, fromStub, nextStub))
}

beforeEach(() => {
  vi.mocked(useAuthStore).mockReset()
})

describe('authGuard', () => {
  it('TC-UNIT-27: redirects an unauthenticated visitor away from a non-public route', async () => {
    mockStore(false)

    const result = await runGuard(fakeRoute('home', false))

    expect(result).toEqual({ name: 'login' })
  })

  it('TC-UNIT-28: redirects an authenticated SuperAdmin away from the login and register routes', async () => {
    mockStore(true, () => Promise.resolve(), true)

    expect(await runGuard(fakeRoute('login', true))).toEqual({ name: 'home' })
    expect(await runGuard(fakeRoute('register', true))).toEqual({ name: 'home' })
  })

  it('TC-UI-F4-01: other authenticated roles are redirected from login and register to /app', async () => {
    mockStore(true)

    expect(await runGuard(fakeRoute('login', true))).toBe('/app')
    expect(await runGuard(fakeRoute('register', true))).toBe('/app')
  })

  it('TC-UI-F4-02: the activation and check-email routes stay reachable while signed in', async () => {
    mockStore(true)

    expect(await runGuard(fakeRoute('activate', true))).toBe(true)
    expect(await runGuard(fakeRoute('check-email', true))).toBe(true)
  })

  it('TC-UNIT-29: waits for a pending bootstrap before deciding', async () => {
    let resolveBootstrap: (() => void) | undefined
    const bootstrapPromise = new Promise<void>((resolve) => {
      resolveBootstrap = resolve
    })
    mockStore(false, () => bootstrapPromise)

    let settled = false
    const guardPromise = runGuard(fakeRoute('home', false)).then((result) => {
      settled = true
      return result
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(settled).toBe(false)

    resolveBootstrap?.()
    const result = await guardPromise

    expect(settled).toBe(true)
    expect(result).toEqual({ name: 'login' })
  })

  it('allows navigation to a public route without requiring a session', async () => {
    mockStore(false)

    const result = await runGuard(fakeRoute('not-found', true))

    expect(result).toBe(true)
  })

  it('allows an authenticated visitor to reach a non-public route', async () => {
    mockStore(true)

    const result = await runGuard(fakeRoute('home', false))

    expect(result).toBe(true)
  })

  it('redirects to home when the route requires SuperAdmin but user is not SuperAdmin', async () => {
    mockStore(true, () => Promise.resolve(), false)

    expect(await runGuard(fakeRoute('users', false, true))).toEqual({ name: 'home' })
    expect(await runGuard(fakeRoute('roles', false, true))).toEqual({ name: 'home' })

    mockStore(true, () => Promise.resolve(), true)
    expect(await runGuard(fakeRoute('users', false, true))).toBe(true)
    expect(await runGuard(fakeRoute('roles', false, true))).toBe(true)
  })
})
