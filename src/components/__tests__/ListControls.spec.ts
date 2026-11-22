import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AccessBadge from '../AccessBadge.vue'
import FilterChips, { type ChipOption } from '../FilterChips.vue'
import PaginationBar from '../PaginationBar.vue'
import StatCard from '../StatCard.vue'
import StatusBadge from '../StatusBadge.vue'

describe('PaginationBar', () => {
  it('TC-UI-F3-32: menampilkan rentang dengan format id-ID dan menandai halaman aktif', () => {
    const wrapper = mount(PaginationBar, { props: { page: 2, limit: 10, total: 1234 } })

    expect(wrapper.find('.nk-pager__info').text()).toBe('Menampilkan 11–20 dari 1.234')
    expect(wrapper.find('[aria-current="page"]').text()).toBe('2')
    expect(
      wrapper.find('button[aria-label="Halaman sebelumnya"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('TC-UI-F3-33: mengirim halaman baru, tombol batas dinonaktifkan, satu halaman tanpa tombol', async () => {
    const wrapper = mount(PaginationBar, { props: { page: 1, limit: 10, total: 25 } })
    expect(
      wrapper.find('button[aria-label="Halaman sebelumnya"]').attributes('disabled'),
    ).toBeDefined()

    await wrapper.find('button[aria-label="Halaman 3"]').trigger('click')
    await wrapper.find('button[aria-label="Halaman berikutnya"]').trigger('click')
    await wrapper.find('button[aria-label="Halaman 1"]').trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[3], [2]])

    const single = mount(PaginationBar, { props: { page: 1, limit: 10, total: 4 } })
    expect(single.find('ul').exists()).toBe(false)
    expect(single.text()).toContain('Menampilkan 1–4 dari 4')

    const none = mount(PaginationBar, { props: { page: 1, limit: 10, total: 0 } })
    expect(none.text()).toContain('Menampilkan 0–0 dari 0')
  })
})

type StatusValue = 'Terbit' | 'Draft'

const options: ChipOption<StatusValue>[] = [
  { value: '', label: 'Semua', count: '8' },
  { value: 'Terbit', label: 'Terbit', count: '5' },
  { value: 'Draft', label: 'Draft' },
]

describe('FilterChips', () => {
  it('TC-UI-F3-34: chip aktif memakai aria-pressed dan mengubah v-model', async () => {
    const wrapper = mount(FilterChips<StatusValue>, {
      props: {
        label: 'Filter status',
        modelValue: '' as StatusValue | '',
        options,
        'onUpdate:modelValue': (value: StatusValue | '') => wrapper.setProps({ modelValue: value }),
      },
    })
    const chips = wrapper.findAll('button')

    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Filter status')
    expect(chips[0]!.attributes('aria-pressed')).toBe('true')
    expect(chips[1]!.text()).toContain('5')
    expect(chips[2]!.find('.nk-chip__count').exists()).toBe(false)

    await chips[1]!.trigger('click')
    expect(wrapper.findAll('button')[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('false')
  })
})

describe('badge dan kartu ringkasan', () => {
  it('TC-UI-F3-35: StatusBadge, AccessBadge, dan StatCard menampilkan label dan varian', () => {
    expect(
      mount(StatusBadge, { props: { tone: 'danger', label: 'Kedaluwarsa' } }).classes(),
    ).toContain('nk-status--danger')

    const premium = mount(AccessBadge, { props: { access: 'Premium' } })
    expect(premium.classes()).toContain('nk-tag--premium')
    expect(premium.find('svg').exists()).toBe(true)
    expect(mount(AccessBadge, { props: { access: 'Gratis' } }).classes()).toContain('nk-tag--free')
    expect(
      mount(AccessBadge, { props: { access: 'Gratis', variant: 'inline' } }).classes(),
    ).toContain('nk-tag--plain')

    const stat = mount(StatCard, {
      props: { label: 'Trial', value: '14', note: 'Berakhir', tone: 'info' },
    })
    expect(stat.text()).toContain('14')
    expect(stat.find('.nk-stat__dot--info').exists()).toBe(true)
  })
})
