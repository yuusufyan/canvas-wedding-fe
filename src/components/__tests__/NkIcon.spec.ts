import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NkIcon from '../NkIcon.vue'
import { NK_ICONS } from '@/constants/nk-icons'

describe('NkIcon', () => {
  it('TC-UI-F2-37: ikon hiasan disembunyikan dari pembaca layar dan memakai ukuran default', () => {
    const wrapper = mount(NkIcon, { props: { name: 'crown' } })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('width')).toBe('20')
    expect(wrapper.findAll('path')).toHaveLength(NK_ICONS.crown.length)
  })

  it('TC-UI-F2-38: label memberi nama aksesibel', () => {
    const wrapper = mount(NkIcon, { props: { name: 'play', size: 30, label: 'Putar' } })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Putar')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('width')).toBe('30')
  })
})
