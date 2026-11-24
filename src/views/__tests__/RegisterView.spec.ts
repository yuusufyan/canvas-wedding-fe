import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import RegisterView from '../RegisterView.vue'
import { useSignupStore } from '@/stores/signup'
import { API_BASE_URL } from '@/constants/api'

type FetchMock = (url: string, init?: RequestInit) => Promise<Response>

function respond(status: number): Response {
  return new Response(JSON.stringify({ code: status, status: 'ok', message: '', data: null }), {
    status,
  })
}

function createTestRouter(): Router {
  const stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/daftar', name: 'register', component: RegisterView },
      { path: '/login', name: 'login', component: stub },
      { path: '/landing', name: 'landing', component: stub },
      { path: '/cek-email', name: 'check-email', component: stub },
    ],
  })
}

async function mountRegister(router = createTestRouter()) {
  await router.push('/daftar')
  await router.isReady()
  return { router, wrapper: mount(RegisterView, { global: { plugins: [router] } }) }
}

async function fill(wrapper: Awaited<ReturnType<typeof mountRegister>>['wrapper']) {
  await wrapper.find('#register-name').setValue(' Hilda Prameswari ')
  await wrapper.find('#register-email').setValue(' hilda@contoh.test ')
  await wrapper.find('#register-password').setValue('Niskala2026!')
}

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('TC-UI-F4-30: atribut form: autocomplete, label, tanpa checkbox Syarat, tautan Masuk', async () => {
    const { wrapper } = await mountRegister()

    expect(wrapper.find('h1').text()).toBe('Mulai undanganmu hari ini')
    expect(wrapper.find('#register-name').attributes('autocomplete')).toBe('name')
    expect(wrapper.find('#register-email').attributes('autocomplete')).toBe('email')
    expect(wrapper.find('#register-password').attributes('autocomplete')).toBe('new-password')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Buat akun gratis')
    expect(wrapper.find('a[href="/login"]').text()).toBe('Masuk')
  })

  it('TC-UI-F4-31: submit kosong tidak memanggil API dan menampilkan galat per field', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = await mountRegister()

    await wrapper.find('form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Nama lengkap wajib diisi.')
    expect(wrapper.text()).toContain('Email wajib diisi.')
    expect(wrapper.text()).toContain('Kata sandi wajib diisi.')
    expect(wrapper.find('#register-name').attributes('aria-invalid')).toBe('true')
  })

  it('TC-UI-F4-32: format email dan kata sandi pendek (hitungan byte) ditolak di klien', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = await mountRegister()

    await wrapper.find('#register-name').setValue('Hilda')
    await wrapper.find('#register-email').setValue('hilda@')
    await wrapper.find('#register-password').setValue('abc12')
    await wrapper.find('form').trigger('submit')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Format email tidak valid.')
    expect(wrapper.text()).toContain('Kata sandi minimal 8 karakter.')

    await wrapper.find('#register-email').setValue('hilda@contoh.test')
    await wrapper.find('#register-password').setValue('é'.repeat(37))
    await wrapper.find('form').trigger('submit')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('maksimal 72 byte')
  })

  it('TC-UI-F4-33: indikator kekuatan tampil saat mengetik dan hanya saran', async () => {
    const { wrapper } = await mountRegister()
    expect(wrapper.find('[data-testid="password-strength"]').exists()).toBe(false)

    await wrapper.find('#register-password').setValue('abc12')
    expect(wrapper.findAll('.nk-strength__bar.is-on')).toHaveLength(1)

    await wrapper.find('#register-password').setValue('Niskala2026!')
    expect(wrapper.findAll('.nk-strength__bar.is-on')).toHaveLength(4)
    expect(wrapper.find('.nk-strength__text').text()).toContain('Sangat kuat')
  })

  it('TC-UI-F4-34: sukses 202 menyimpan email di store, mengosongkan sandi, dan membuka Cek Email', async () => {
    const fetchMock = vi.fn<FetchMock>(async () => respond(202))
    vi.stubGlobal('fetch', fetchMock)
    const { router, wrapper } = await mountRegister()

    await fill(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API_BASE_URL}/auth/register`)
    expect(JSON.parse(String(init!.body))).toEqual({
      name: 'Hilda Prameswari',
      email: 'hilda@contoh.test',
      password: 'Niskala2026!', // secret-scan:ignore nilai palsu untuk test
    })
    expect(useSignupStore().pendingEmail).toBe('hilda@contoh.test')
    expect(router.currentRoute.value.name).toBe('check-email')
    expect(router.currentRoute.value.fullPath).not.toContain('hilda')
    expect(wrapper.find<HTMLInputElement>('#register-password').element.value).toBe('')
  })

  it('TC-UI-F4-35: klik ganda saat request berjalan hanya mengirim satu request', async () => {
    let resolve: (value: Response) => void = () => {}
    const fetchMock = vi.fn<FetchMock>(() => new Promise((r) => (resolve = r)))
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = await mountRegister()
    await fill(wrapper)

    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#register-email').attributes('disabled')).toBeDefined()
    resolve(respond(202))
    await flushPromises()
  })

  it('TC-UI-F4-36: 429, 400, dan jaringan putus menampilkan banner generik tanpa membuka Cek Email', async () => {
    const cases: [() => Promise<Response>, string][] = [
      [async () => respond(429), 'Terlalu banyak percobaan. Coba lagi nanti.'],
      [async () => respond(400), 'Periksa kembali data yang dimasukkan.'],
      [async () => respond(500), 'Terjadi kesalahan, silakan coba lagi.'],
    ]
    for (const [impl, message] of cases) {
      vi.stubGlobal('fetch', vi.fn<FetchMock>(impl))
      setActivePinia(createPinia())
      const { router, wrapper } = await mountRegister(createTestRouter())
      await fill(wrapper)
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[role="alert"]').text()).toBe(message)
      expect(router.currentRoute.value.name).toBe('register')
      expect(useSignupStore().pendingEmail).toBeNull()
      wrapper.unmount()
    }

    vi.stubGlobal('fetch', vi.fn<FetchMock>().mockRejectedValue(new TypeError('Failed to fetch')))
    const { wrapper } = await mountRegister(createTestRouter())
    await fill(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Tidak bisa terhubung ke server')
  })
})
