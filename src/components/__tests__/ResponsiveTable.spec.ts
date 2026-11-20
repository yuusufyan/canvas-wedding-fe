import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResponsiveTable, { type TableColumn } from '../ResponsiveTable.vue'

interface Row {
  id: string
  name: string
  status: string
  note: string
}

const columns: TableColumn[] = [
  { key: 'name', label: 'Nama', role: 'primary' },
  { key: 'status', label: 'Status', role: 'status' },
  { key: 'note', label: 'Catatan', role: 'meta' },
  { key: 'actions', label: 'Aksi', role: 'action' },
]
const rows: Row[] = [
  { id: '1', name: 'Satu', status: 'Aktif', note: 'a' },
  { id: '2', name: 'Dua', status: 'Draft', note: 'b' },
]

function stubWidth(wide: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: wide,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    }),
  )
}

function mountTable() {
  return mount(ResponsiveTable<Row>, {
    props: { columns, rows, rowKey: (row: Row) => row.id, caption: 'Daftar contoh' },
    slots: {
      'cell-name': '<template #cell-name="{ row }"><b class="name">{{ row.name }}</b></template>',
      'cell-actions':
        '<template #cell-actions="{ row }"><button>Aksi {{ row.name }}</button></template>',
    },
  })
}

describe('ResponsiveTable', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('TC-UI-F3-30: >= 768 merender tabel penuh dengan caption dan header kolom', () => {
    stubWidth(true)
    const wrapper = mountTable()

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('ul.nk-cards').exists()).toBe(false)
    expect(wrapper.find('caption').text()).toBe('Daftar contoh')
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual([
      'Nama',
      'Status',
      'Catatan',
      'Aksi',
    ])
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.find('.name').text()).toBe('Satu')
    expect(wrapper.text()).toContain('Aktif')
  })

  it('TC-UI-F3-31: < 768 merender daftar kartu: nama, status, aksi, dan keterangan', () => {
    stubWidth(false)
    const wrapper = mountTable()

    expect(wrapper.find('table').exists()).toBe(false)
    const cards = wrapper.findAll('li.nk-rowcard')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.find('.nk-rowcard__main').text()).toBe('Satu')
    expect(cards[0]!.find('.nk-rowcard__side').text()).toContain('Aktif')
    expect(cards[0]!.find('.nk-rowcard__side button').text()).toBe('Aksi Satu')
    expect(cards[0]!.find('.nk-rowcard__meta').text()).toContain('Catatan')
    expect(wrapper.find('ul').attributes('aria-label')).toBe('Daftar contoh')
  })
})
