import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ActivateView from '../ActivateView.vue'
import { API_BASE_URL } from '@/constants/api'

type FetchMock = (url: string, init?: RequestInit) => Promise<Response>

const TOKEN = 'T'.repeat(43)

function respond(status: number): Response {
  return new Response(JSON.stringify({ code: status, status: 'ok', message: '', data: null }), {
    status,
  })
}

async function mountPage(hash = `#token=${TOKEN}`) {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/aktivasi', name: 'activate', component: ActivateView },
      { path: '/login', name: 'login', component: stub },
      { path: '/landing', name: 'landing', component: stub },
    ],
  })
  window.history.replaceState({}, '', `/aktivasi${hash}`)
  await router.push('/aktivasi')
  await router.isReady()
  return mount(ActivateView, { global: { plugins: [router] } })
}

describe('ActivateView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('TC-UI-F4-42: token dihapus dari URL sebelum request, dikirim lewat POST body, lalu tampil berhasil', async () => {
    let urlAtRequest = ''
    const fetchMock = vi.fn<FetchMock>(async () => {
      urlAtRequest = window.location.href
      return respond(200)
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = await mountPage()
    expect(wrapper.find('h1').text()).toBe('Mengaktifkan akunmu…')
    await flushPromises()

    expect(urlAtRequest).not.toContain(TOKEN)
    expect(urlAtRequest).not.toContain('token')
    expect(window.location.hash).toBe('')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API_BASE_URL}/auth/verify-email`)
    expect(init!.method).toBe('POST')
    expect(JSON.parse(String(init!.body))).toEqual({ token: TOKEN })
    expect(wrapper.find('h1').text()).toBe('Akunmu sudah aktif')
    expect(wrapper.find('a[href="/login"]').text()).toContain('Masuk sekarang')
    expect(JSON.stringify({ ...sessionStorage, ...localStorage })).not.toContain(TOKEN)
  })

  it('TC-UI-F4-43: token tidak masuk console saat berhasil maupun gagal', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => respond(400)),
    )

    await mountPage()
    await flushPromises()

    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(TOKEN)
    }
    spies.forEach((spy) => spy.mockRestore())
  })

  it('TC-UI-F4-44: 400 (kedaluwarsa, tidak dikenal, atau terpakai) satu hasil generik dengan form kirim tautan baru', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => respond(400)),
    )

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Tautan sudah tidak berlaku')
    expect(wrapper.text()).toContain('berlaku 24 jam')
    expect(wrapper.find('#activate-email').exists()).toBe(true)
    expect(wrapper.find('a[href="/login"]').text()).toBe('Masuk')
  })

  it('TC-UI-F4-45: tanpa token atau token berformat salah langsung tampil tidak berlaku tanpa request', async () => {
    const fetchMock = vi.fn<FetchMock>()
    vi.stubGlobal('fetch', fetchMock)

    const none = await mountPage('')
    await flushPromises()
    expect(none.find('h1').text()).toBe('Tautan sudah tidak berlaku')

    const bad = await mountPage('#token=pendek')
    await flushPromises()
    expect(bad.find('h1').text()).toBe('Tautan sudah tidak berlaku')
    expect(window.location.hash).toBe('')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('TC-UI-F4-46: galat jaringan atau server tidak menghanguskan token dan bisa dicoba lagi', async () => {
    const fetchMock = vi
      .fn<FetchMock>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respond(200))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Belum bisa memverifikasi')

    await wrapper.find('button.nk-btn').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1]!.body))).toEqual({ token: TOKEN })
    expect(wrapper.find('h1').text()).toBe('Akunmu sudah aktif')
  })

  it('TC-UI-F4-47: 429 saat verifikasi dianggap galat sementara, bukan token tidak berlaku', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchMock>(async () => respond(429)),
    )

    const wrapper = await mountPage()
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Belum bisa memverifikasi')
  })

  it('TC-UI-F4-48: kirim tautan baru: validasi email, jawaban generik, dan hitung mundur 60 detik', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<FetchMock>(async (url) =>
      url === `${API_BASE_URL}/auth/verify-email` ? respond(400) : respond(202),
    )
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountPage('')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Email wajib diisi.')
    expect(fetchMock).not.toHaveBeenCalled()

    await wrapper.find('#activate-email').setValue('hilda@contoh.test')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const resend = fetchMock.mock.calls.filter(
      ([u]) => u === `${API_BASE_URL}/auth/resend-verification`,
    )
    expect(resend).toHaveLength(1)
    expect(JSON.parse(String(resend[0]![1]!.body))).toEqual({ email: 'hilda@contoh.test' })
    expect(wrapper.find('[role="status"]').text()).toContain('Jika akunmu perlu diaktifkan')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Kirim ulang tersedia dalam 01:00')

    await vi.advanceTimersByTimeAsync(61_000)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('TC-UI-F4-49: kirim tautan baru gagal (429 atau galat) menampilkan pesan generik', async () => {
    const fetchMock = vi.fn<FetchMock>(async (url) =>
      url === `${API_BASE_URL}/auth/verify-email` ? respond(400) : respond(429),
    )
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = await mountPage('')
    await flushPromises()
    await wrapper.find('#activate-email').setValue('hilda@contoh.test')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Terlalu banyak permintaan')

    fetchMock.mockImplementation(async (url) =>
      url === `${API_BASE_URL}/auth/verify-email` ? respond(400) : respond(500),
    )
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Belum bisa mengirim email')
  })
})
