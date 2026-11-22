import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ToastHost from '../ToastHost.vue'
import { useToast } from '@/composables/useToast'

describe('ToastHost', () => {
  afterEach(() => {
    const { toasts, dismiss } = useToast()
    const list = toasts.value
    list.forEach((t) => dismiss(t.id))
    vi.useRealTimers()
  })

  it('TC-UI-F3-39: menampilkan toast di live region dan menutupnya lewat tombol', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ToastHost)
    expect(wrapper.attributes('aria-live')).toBe('polite')

    useToast().success('Template dibuat')
    await nextTick()
    expect(wrapper.find('.nk-toast--success').text()).toContain('Template dibuat')

    await wrapper.find('button[aria-label="Tutup pemberitahuan"]').trigger('click')
    expect(wrapper.findAll('.nk-toast')).toHaveLength(0)
  })
})
