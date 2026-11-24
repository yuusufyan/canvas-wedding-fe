import { describe, expect, it } from 'vitest'
import { countChanges, diffSets, groupMenus, groupPermissions, summarizeChanges } from '../access'

describe('diffSets dan ringkasan', () => {
  it('TC-UI-F5-03: menghitung yang ditambah dan dicabut terhadap set dasar', () => {
    const diff = diffSets(new Set(['a', 'b', 'c']), new Set(['b', 'c', 'd', 'e']))

    expect(diff).toEqual({ added: ['d', 'e'], removed: ['a'] })
    expect(diffSets(new Set(['a']), new Set(['a']))).toEqual({ added: [], removed: [] })
  })

  it('TC-UI-F5-04: ringkasan menggabungkan beberapa selisih dan hanya menyebut yang ada', () => {
    const counts = countChanges({ added: ['x', 'y'], removed: [] }, { added: [], removed: ['z'] })

    expect(counts).toEqual({ added: 2, removed: 1 })
    expect(summarizeChanges(counts)).toBe('2 ditambah · 1 dicabut')
    expect(summarizeChanges({ added: 0, removed: 3 })).toBe('3 dicabut')
    expect(summarizeChanges({ added: 1, removed: 0 })).toBe('1 ditambah')
    expect(summarizeChanges({ added: 0, removed: 0 })).toBe('')
  })
})

describe('groupPermissions dan groupMenus', () => {
  it('TC-UI-F5-05: permission dikelompokkan menurut awalan kode dengan urutan katalog', () => {
    const groups = groupPermissions([
      { code: 'templates.read', description: 'a' },
      { code: 'guests.read', description: 'b' },
      { code: 'templates.write', description: 'c' },
      { code: 'lain.read', description: 'd' },
    ])

    expect(groups.map((g) => [g.key, g.title, g.items.length])).toEqual([
      ['templates', 'Template', 2],
      ['guests', 'Tamu', 1],
      ['lain', 'lain', 1],
    ])
  })

  it('TC-UI-F5-06: menu dikelompokkan per area, urut sortOrder, area kosong dibuang', () => {
    const menu = (key: string, order: number) => ({
      key,
      label: key,
      path: '/',
      icon: null,
      parentKey: null,
      sortOrder: order,
    })
    const groups = groupMenus([menu('app.b', 20), menu('admin.z', 5), menu('app.a', 10)])

    expect(groups.map((g) => [g.title, g.items.map((m) => m.key)])).toEqual([
      ['Area admin', ['admin.z']],
      ['Area pelanggan', ['app.a', 'app.b']],
    ])
    expect(groupMenus([menu('app.a', 1)]).map((g) => g.key)).toEqual(['app'])
  })
})
