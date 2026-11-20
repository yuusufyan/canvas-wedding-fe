import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import CheckEmailView from '../CheckEmailView.vue'
import { useSignupStore } from '@/stores/signup'

type FetchMock = (url: string, init?: RequestInit) => Promise<Response>

function respond(status: number): Response {
  return new Response(JSON.stringify({ code: status, status: 'ok', message: '', data: null }), {
    status,
  })
}

async function mountPage() {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cek-email', name: 'check-email', component: CheckEmailView },
      { path: '/daftar', name: 'register', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/landing', name: 'landing', component: stub },
      { path: '/aktivasi', name: 'activate', component: stub },
    ],
  })
  await router.push('/cek-email')
  await router.isReady()
  return mount(CheckEmailView, { global: { plugins: [router] } })
}

describe('CheckEmailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('TC-UI-F4-37: menampilkan email dari store, masa berlaku 24 jam, dan hitung mundur 60 detik', async () => {
    useSignupStore().remember('hilda@contoh.test')
    const wrapper = await mountPage()

    expect(wrapper.find('h1').text()).toBe('Cek email-mu')
    expect(wrapper.find('[data-testid="pending-email"]').text()).toBe('hilda@contoh.test')
    expect(wrapper.text()).toContain('berlaku 24 jam')
    expect(wrapper.find('[data-testid="resend-countdown"]').text()).toContain('01:00')
    expect(wrapper.find('section button').attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(15_000)
    expect(wrapper.find('[data-testid="resend-countdown"]').text()).toContain('00:45')
    expect(document.title).toBe('Cek email | Niskala Daisy')
  })

  it('TC-UI-F4-38: tombol kirim ulang aktif setelah hitung mundur, mengirim sekali, lalu mengulang hitung mundur', async () => {
    const fetchMock = vi.fn<FetchMock>(async () => respond(202))
    vi.stubGlobal('fetch', fetchMock)
    useSignupStore().remember('hilda@contoh.test')
    const wrapper = await mountPage()

    await vi.advanceTimersByTimeAsync(61_000)
    const button = wrapper.find('section button')
    expect(button.attributes('disabled')).toBeUndefined()

    await button.trigger('click')
    await button.trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toEqual({
      email: 'hilda@contoh.test',
    })
    expect(wrapper.find('[role="status"]').text()).toContain('Email baru sudah dikirim')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="resend-countdown"]').text()).toContain('01:00')
  })

  it('TC-UI-F4-39: kirim ulang gagal (429 atau galat) menampilkan pesan generik tanpa membocorkan akun', async () => {
    const fetchMock = vi.fn<FetchMock>(async () => respond(429))
    vi.stubGlobal('fetch', fetchMock)
    useSignupStore().remember('hilda@contoh.test')
    const wrapper = await mountPage()
    await vi.advanceTimersByTimeAsync(61_000)

    await wrapper.find('section button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Terlalu banyak permintaan')

    fetchMock.mockImplementation(async () => respond(500))
    await wrapper.find('section button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Belum bisa mengirim email')
  })

  it('TC-UI-F4-40: tanpa email di memori (halaman dimuat ulang) tampil versi generik tanpa alamat dan tanpa kirim ulang', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('email yang kamu daftarkan')
    expect(wrapper.find('[data-testid="pending-email"]').exists()).toBe(false)
    expect(wrapper.find('section button').exists()).toBe(false)
    expect(wrapper.find('a[href="/aktivasi"]').text()).toBe('Minta tautan baru')
  })

  it('TC-UI-F4-41: tautan Ubah ke Daftar dan Masuk ke Masuk', async () => {
    useSignupStore().remember('hilda@contoh.test')
    const wrapper = await mountPage()

    expect(wrapper.find('a[href="/daftar"]').text()).toBe('Ubah')
    expect(wrapper.find('a[href="/login"]').text()).toBe('Masuk')
  })
})
