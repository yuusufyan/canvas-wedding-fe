import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InvitationRenderer from '../InvitationRenderer.vue'
import type { InvitationPage } from '@/types/invitation-document'

const page: InvitationPage = {
  id: 'p1',
  title: 'Acara',
  background: '#2F3A30',
  elements: [
    {
      id: 't',
      type: 'text',
      text: 'Akad Nikah',
      x: 36,
      y: 64,
      width: 288,
      height: 40,
      font: 'serif',
      size: 26,
      color: '#F4EDE0',
      align: 'center',
      uppercase: true,
      letter_spacing: 0.3,
    },
    {
      id: 's',
      type: 'shape',
      shape: 'arch',
      fill: '#F4EDE0',
      x: 36,
      y: 250,
      width: 288,
      height: 340,
    },
    {
      id: 'c',
      type: 'countdown',
      target: '2026-12-12T08:00:00+07:00',
      color: '#F4EDE0',
      x: 28,
      y: 160,
      width: 304,
      height: 56,
    },
    {
      id: 'b',
      type: 'button',
      label: 'Buka undangan',
      fill: '#E9D8B4',
      color: '#2F3A30',
      x: 115,
      y: 440,
      width: 130,
      height: 30,
    },
  ],
}

describe('InvitationRenderer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('TC-UI-F2-32: merender teks, bentuk, countdown, dan tombol dengan posisi persentase', () => {
    const wrapper = mount(InvitationRenderer, { props: { page } })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Halaman undangan: Acara')
    const text = wrapper.find('.nk-el--text')
    expect(text.text()).toBe('Akad Nikah')
    expect(text.classes()).toContain('nk-font-serif')
    expect(text.attributes('style')).toContain('left: 10%')
    expect(wrapper.findAll('.nk-cd')).toHaveLength(4)
    expect(wrapper.find('.nk-el--button').text()).toBe('Buka undangan')
    expect(wrapper.find('[style*="border-radius"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('TC-UI-F2-33: mode hiasan disembunyikan dari pembaca layar dan animasi opsional', () => {
    const wrapper = mount(InvitationRenderer, { props: { page, decorative: true, animated: true } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).toContain('nk-stage--animated')
    wrapper.unmount()
  })

  it('TC-UI-F2-34: nilai warna tidak aman dari data tidak diteruskan ke style', () => {
    const hostile: InvitationPage = {
      ...page,
      background: 'url(javascript:alert(1))',
      elements: [
        {
          id: 'x',
          type: 'text',
          text: '<img src=x onerror=alert(1)>',
          x: 0,
          y: 0,
          width: 100,
          height: 20,
          font: 'sans',
          size: 12,
          color: 'red;background:url(x)',
          align: 'left',
        },
      ],
    }
    const wrapper = mount(InvitationRenderer, { props: { page: hostile } })

    expect(wrapper.attributes('style') ?? '').not.toContain('javascript')
    expect(wrapper.find('.nk-el--text').attributes('style')).not.toContain('url(x)')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.nk-el--text').text()).toBe('<img src=x onerror=alert(1)>')
    wrapper.unmount()
  })
})
