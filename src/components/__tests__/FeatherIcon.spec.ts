import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import FeatherIcon from '../FeatherIcon.vue'

describe('FeatherIcon', () => {
  it('renders the requested icon at the default size, hidden from assistive tech', () => {
    const wrapper = mount(FeatherIcon, { props: { name: 'eye' } })
    const svg = wrapper.find('svg')

    expect(svg.classes()).toContain('feather-eye')
    expect(svg.attributes('width')).toBe('14')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('exposes an accessible name when a label is given', () => {
    const wrapper = mount(FeatherIcon, { props: { name: 'trash-2', size: 18, label: 'Hapus' } })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Hapus')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.find('svg').attributes('width')).toBe('18')
  })
})
