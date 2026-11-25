import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DemoPlayer from '../DemoPlayer.vue'
import { mockTemplateDemo } from '@/api/mock/templates'

function stubReducedMotion(reduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduced,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }),
  )
}

function mountPlayer() {
  return mount(DemoPlayer, { props: { demo: mockTemplateDemo('rustic-hijau')! } })
}

describe('DemoPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('TC-UI-F2-51: preferensi gerak dikurangi membuat pemutar mulai terjeda', () => {
    stubReducedMotion(true)
    const wrapper = mountPlayer()

    expect(wrapper.find('.nk-ctl--play').attributes('aria-label')).toBe('Putar')
    wrapper.unmount()
  })

  it('TC-UI-F2-52: pemutar mulai otomatis, bisa dijeda, dan pindah bagian lewat kontrol', async () => {
    stubReducedMotion(false)
    const wrapper = mountPlayer()
    const play = wrapper.find('.nk-ctl--play')

    expect(play.attributes('aria-label')).toBe('Jeda')
    await play.trigger('click')
    expect(play.attributes('aria-label')).toBe('Putar')

    await wrapper.find('button[aria-label="Bagian berikutnya"]').trigger('click')
    expect(wrapper.find('.nk-sections .is-active').text()).toContain('Ayat')
    expect(wrapper.find('.nk-stage').attributes('aria-label')).toBe('Halaman undangan: Ayat')

    await wrapper.findAll('.nk-sections button')[3]?.trigger('click')
    expect(wrapper.find('.nk-stage').attributes('aria-label')).toContain('Acara & Countdown')
    expect(wrapper.find('.nk-cd').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F2-53: posisi timeline dan saklar Otomatis dapat diubah dan dibaca pembaca layar', async () => {
    stubReducedMotion(true)
    const wrapper = mountPlayer()
    const range = wrapper.find('input[type="range"]')

    await range.setValue('20')
    expect(wrapper.text()).toContain('00:20 / 00:40')
    expect(range.attributes('aria-valuetext')).toContain('dari 8')

    const toggle = wrapper.find('[role="switch"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })
})
