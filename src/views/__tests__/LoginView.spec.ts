import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import LoginView from '../LoginView.vue'
import { clearSession } from '@/api/token'
import type { TokenResponse } from '@/types/auth'
import { API_BASE_URL } from '@/constants/api'

const tokens: TokenResponse = {
  accessToken: 'access-1', // secret-scan:ignore fake value
  refreshToken: 'refresh-1', // secret-scan:ignore fake value
  tokenType: 'Bearer',
  expiresIn: 1800,
}

type MockResponse = Pick<Response, 'ok' | 'status'> & { json: () => Promise<unknown> }

function jsonResponse(status: number, data: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ code: status, status: 'ok', message: '', data }),
  }
}

// Respons sukses backend NestJS: body apa adanya, tanpa envelope.
function rawResponse(status: number, body: unknown): MockResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

type FetchMock = (url: string, init?: RequestInit) => Promise<MockResponse>

async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/landing', name: 'landing', component: { template: '<div />' } },
      { path: '/daftar', name: 'register', component: { template: '<div />' } },
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
    ],
  })
}

async function mountLogin(router: Router) {
  router.push('/login')
  await router.isReady()
  return mount(LoginView, { global: { plugins: [router] } })
}

beforeEach(() => {
  setActivePinia(createPinia())
  clearSession()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginView', () => {
  it('TC-UNIT-30: renders empty fields and the submit button without any prefilled value', async () => {
    const wrapper = await mountLogin(createTestRouter())

    const email = wrapper.find<HTMLInputElement>('#login-email')
    const password = wrapper.find<HTMLInputElement>('#login-password')

    expect(email.element.value).toBe('')
    expect(password.element.value).toBe('')
    expect(wrapper.find('button[type="submit"]').text()).toContain('Masuk')
  })

  it('TC-UNIT-31: an empty submit never calls fetch and shows validation messages', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())

    await wrapper.find('form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Email wajib diisi.')
    expect(wrapper.text()).toContain('Kata sandi wajib diisi.')
  })

  it('validates email format before submitting', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())

    await wrapper.find('#login-email').setValue('bukan-email')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Format email tidak valid.')
  })

  it('TC-UNIT-32: a second click while submitting is ignored, fetch runs once', async () => {
    let resolveLogin: ((value: MockResponse) => void) | undefined
    const fetchMock = vi.fn<FetchMock>((url) => {
      if (url === `${API_BASE_URL}/auth/login`) {
        return new Promise((resolve) => {
          resolveLogin = resolve
        })
      }
      return Promise.resolve(
        rawResponse(200, {
          id: '1',
          name: 'Admin',
          email: 'admin@example.com',
          role: 'superadmin',
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())

    await wrapper.find('#login-email').setValue('admin@example.com')
    await wrapper.find('#login-password').setValue('rahasia123')

    const form = wrapper.find('form')
    await form.trigger('submit')
    await form.trigger('submit')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveLogin?.(
      rawResponse(200, {
        ...tokens,
        user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'superadmin' },
      }),
    )
    await flushPromises()
  })

  it('TC-UNIT-33: toggling reveals the password, remounting resets it back to hidden', async () => {
    const router = createTestRouter()
    const wrapper = await mountLogin(router)

    await wrapper.find('#login-password').setValue('rahasia123')
    expect(wrapper.find('#login-password').attributes('type')).toBe('password')

    await wrapper.find('button[aria-label="Tampilkan kata sandi"]').trigger('click')
    expect(wrapper.find('#login-password').attributes('type')).toBe('text')

    wrapper.unmount()
    const remounted = await mountLogin(router)
    expect(remounted.find('#login-password').attributes('type')).toBe('password')
  })

  it('TC-UNIT-34: a 401 keeps the fixed error message, clears the password, and keeps the email', async () => {
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse(401, null))
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())

    await wrapper.find('#login-email').setValue('admin@example.com')
    await wrapper.find('#login-password').setValue('salah')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email atau kata sandi salah')
    expect(wrapper.find<HTMLInputElement>('#login-password').element.value).toBe('')
    expect(wrapper.find<HTMLInputElement>('#login-email').element.value).toBe('admin@example.com')
  })

  it('TC-UNIT-36: the form carries the required security attributes and never submits natively', async () => {
    const wrapper = await mountLogin(createTestRouter())
    const form = wrapper.find('form')
    const email = wrapper.find('#login-email')
    const password = wrapper.find('#login-password')

    expect(form.attributes('method')).toBe('post')
    expect(email.attributes('autocomplete')).toBe('username email')
    expect(password.attributes('autocomplete')).toBe('current-password')
    expect(email.attributes('spellcheck')).toBe('false')
    expect(password.attributes('spellcheck')).toBe('false')

    await wrapper.find('button[aria-label="Tampilkan kata sandi"]').trigger('click')
    expect(password.attributes('spellcheck')).toBe('false')

    expect(form.element.getAttribute('action')).toBeNull()
  })
})
