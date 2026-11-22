import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AccordionList from '../AccordionList.vue'

const items = [
  { id: 'a', question: 'Pertanyaan A', answer: 'Jawaban A' },
  { id: 'b', question: 'Pertanyaan B', answer: 'Jawaban B' },
]

describe('AccordionList', () => {
  it('TC-UI-F2-35: item default terbuka dan aria-expanded mengikuti state', () => {
    const wrapper = mount(AccordionList, { props: { items, defaultOpenId: 'a' } })
    const buttons = wrapper.findAll('button')

    expect(buttons[0]?.attributes('aria-expanded')).toBe('true')
    expect(buttons[1]?.attributes('aria-expanded')).toBe('false')
    const panels = wrapper.findAll('[role="region"]')
    expect(panels[0]?.isVisible()).toBe(true)
    expect(panels[1]?.isVisible()).toBe(false)
  })

  it('TC-UI-F2-36: membuka satu item menutup yang lain dan klik ulang menutupnya', async () => {
    const wrapper = mount(AccordionList, { props: { items, defaultOpenId: 'a' } })
    const buttons = wrapper.findAll('button')

    await buttons[1]?.trigger('click')
    expect(buttons[0]?.attributes('aria-expanded')).toBe('false')
    expect(buttons[1]?.attributes('aria-expanded')).toBe('true')

    await buttons[1]?.trigger('click')
    expect(buttons[1]?.attributes('aria-expanded')).toBe('false')
    expect(buttons[1]?.attributes('aria-controls')).toBe(
      wrapper.findAll('[role="region"]')[1]?.attributes('id'),
    )
  })
})
