import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import LoginView from '../LoginView.vue'
import { clearSession } from '@/api/token'
import type { MeResponse, TokenResponse } from '@/types/auth'
import { API_BASE_URL } from '@/constants/api'

const tokens: TokenResponse = {
  accessToken: 'access-1', // secret-scan:ignore fake value
  refreshToken: 'refresh-1', // secret-scan:ignore fake value
  tokenType: 'Bearer',
  expiresIn: 1800,
}

function me(role: string): MeResponse {
  return {
    id: '1',
    name: 'Pengguna',
    email: 'pengguna@contoh.test',
    role,
    permissions: [],
    menus: [],
  }
}

type FetchMock = (url: string, init?: RequestInit) => Promise<Response>

function json(status: number, data: unknown = null): Response {
  return new Response(JSON.stringify({ code: status, status: 'ok', message: '', data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Respons sukses backend NestJS: body apa adanya, tanpa envelope.
function raw(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createTestRouter(): Router {
  const stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/daftar', name: 'register', component: stub },
      { path: '/landing', name: 'landing', component: stub },
      { path: '/dashboard', name: 'home', component: stub },
      { path: '/app', name: 'app', component: stub },
    ],
  })
}

async function mountLogin(router: Router) {
  await router.push('/login')
  await router.isReady()
  return mount(LoginView, { global: { plugins: [router] } })
}

async function submit(wrapper: Awaited<ReturnType<typeof mountLogin>>) {
  await wrapper.find('#login-email').setValue('admin@contoh.test')
  await wrapper.find('#login-password').setValue('rahasia123')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('LoginView (auth baru)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearSession()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('TC-UI-F4-20: login SuperAdmin diarahkan ke halaman admin, role lain ke /app', async () => {
    for (const [role, target] of [
      ['superadmin', '/dashboard'],
      ['user', '/app'],
    ] as const) {
      setActivePinia(createPinia())
      vi.stubGlobal(
        'fetch',
        vi.fn<FetchMock>(async (url) =>
          url === `${API_BASE_URL}/auth/login`
            ? raw(200, {
                code: 200,
                status: 'success',
                message: '',
                data: { ...tokens, user: me(role) },
              })
            : raw(200, { code: 200, status: 'success', message: '', data: me(role) }),
        ),
      )
      const router = createTestRouter()
      const wrapper = await mountLogin(router)

      await submit(wrapper)

      expect(router.currentRoute.value.path).toBe(target)
      wrapper.unmount()
    }
  })

  it('TC-UI-F4-21: 401 menampilkan satu banner generik yang sama, apa pun penyebabnya', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => json(401)),
    )
    const wrapper = await mountLogin(createTestRouter())

    await submit(wrapper)

    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toBe('Email atau kata sandi salah')
    expect(wrapper.find('button.nk-alert__action').exists()).toBe(false)
    expect(wrapper.find<HTMLInputElement>('#login-password').element.value).toBe('')
  })

  it('TC-UI-F4-22: 429 menampilkan banner batas percobaan 15 menit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => json(429)),
    )
    const wrapper = await mountLogin(createTestRouter())

    await submit(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
    )
  })

  it('TC-UI-F4-23: kegagalan jaringan dan galat server menampilkan pesan generik', async () => {
    vi.stubGlobal('fetch', vi.fn<FetchMock>().mockRejectedValue(new TypeError('Failed to fetch')))
    const offline = await mountLogin(createTestRouter())
    await submit(offline)
    expect(offline.find('[role="alert"]').text()).toContain('Tidak bisa terhubung ke server')
    offline.unmount()

    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => json(500)),
    )
    const broken = await mountLogin(createTestRouter())
    await submit(broken)
    expect(broken.find('[role="alert"]').text()).toBe('Terjadi kesalahan, silakan coba lagi.')
    expect(broken.text()).not.toContain('500')
  })

  it('TC-UI-F4-24: 403 akun belum aktif menampilkan banner kuning dengan tombol Kirim ulang tautan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => json(403)),
    )
    const wrapper = await mountLogin(createTestRouter())

    await submit(wrapper)

    const banner = wrapper.find('.nk-alert--warning')
    expect(banner.text()).toContain('Akunmu belum diaktifkan')
    expect(banner.find('button.nk-alert__action').text()).toBe('Kirim ulang tautan')
  })

  it('TC-UI-F4-25: kirim ulang memakai email yang diketik, jawaban selalu sama, lalu hitung mundur', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<FetchMock>(async (url) =>
      url === `${API_BASE_URL}/auth/login` ? json(403) : json(202),
    )
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())
    await submit(wrapper)

    const button = wrapper.find('button.nk-alert__action')
    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()

    const resendCalls = fetchMock.mock.calls.filter(
      ([url]) => url === `${API_BASE_URL}/auth/resend-verification`,
    )
    expect(resendCalls).toHaveLength(1)
    expect(JSON.parse(String(resendCalls[0]![1]!.body))).toEqual({ email: 'admin@contoh.test' })
    expect(wrapper.text()).toContain('Jika akunmu perlu diaktifkan')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Tersedia lagi dalam 01:00')

    await vi.advanceTimersByTimeAsync(61_000)
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('TC-UI-F4-26: kirim ulang dengan email tidak valid memfokuskan kolom email; 429 dan galat punya pesan', async () => {
    const fetchMock = vi.fn<FetchMock>(async (url) =>
      url === `${API_BASE_URL}/auth/login` ? json(403) : json(429),
    )
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountLogin(createTestRouter())
    await submit(wrapper)

    await wrapper.find('#login-email').setValue('rusak')
    await wrapper.find('button.nk-alert__action').trigger('click')
    expect(wrapper.text()).toContain('Format email tidak valid.')
    expect(
      fetchMock.mock.calls.some(([url]) => url === `${API_BASE_URL}/auth/resend-verification`),
    ).toBe(false)

    await wrapper.find('#login-email').setValue('admin@contoh.test')
    await wrapper.find('button.nk-alert__action').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Terlalu banyak permintaan')

    fetchMock.mockImplementation(async (url) =>
      url === `${API_BASE_URL}/auth/login` ? json(403) : json(500),
    )
    await wrapper.find('#login-password').setValue('rahasia123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wrapper.find('button.nk-alert__action').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Belum bisa mengirim email')
  })

  it('TC-UI-F4-27: kata sandi dikosongkan setelah submit dan tidak pernah masuk URL atau storage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => json(401)),
    )
    const wrapper = await mountLogin(createTestRouter())

    await submit(wrapper)

    expect(wrapper.find<HTMLInputElement>('#login-password').element.value).toBe('')
    expect(window.location.href).not.toContain('rahasia123')
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('rahasia123')
    expect(JSON.stringify({ ...localStorage })).not.toContain('rahasia123')
  })

  it('TC-UI-F4-28: ada tautan Daftar gratis ke /daftar dan tidak ada tautan Lupa kata sandi', async () => {
    const wrapper = await mountLogin(createTestRouter())

    expect(wrapper.find('a[href="/daftar"]').text()).toBe('Daftar gratis')
    expect(wrapper.text()).not.toContain('Lupa kata sandi')
    expect(wrapper.find('h1').text()).toBe('Selamat datang kembali')
  })

  it('TC-UI-F4-29: kolom email dan kata sandi terhubung ke pesan galat lewat aria-describedby', async () => {
    const wrapper = await mountLogin(createTestRouter())

    await wrapper.find('form').trigger('submit')

    const email = wrapper.find('#login-email')
    expect(email.attributes('aria-invalid')).toBe('true')
    const describedBy = email.attributes('aria-describedby')!
    expect(wrapper.find(`#${describedBy}`).text()).toContain('Email wajib diisi.')
  })
})
