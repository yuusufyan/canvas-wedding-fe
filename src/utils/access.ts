import type { CatalogMenu, Permission } from '@/types/access'

export interface AccessDiff {
  added: string[]
  removed: string[]
}

// Selisih dua set kode/key; urutan hasil mengikuti urutan katalog yang diberikan.
export function diffSets(baseline: ReadonlySet<string>, current: ReadonlySet<string>): AccessDiff {
  return {
    added: [...current].filter((code) => !baseline.has(code)),
    removed: [...baseline].filter((code) => !current.has(code)),
  }
}

export function countChanges(...diffs: AccessDiff[]): { added: number; removed: number } {
  return {
    added: diffs.reduce((sum, d) => sum + d.added.length, 0),
    removed: diffs.reduce((sum, d) => sum + d.removed.length, 0),
  }
}

// Teks ringkasan perubahan: "2 ditambah · 1 dicabut"; kosong bila tidak ada perubahan.
export function summarizeChanges(counts: { added: number; removed: number }): string {
  const parts: string[] = []
  if (counts.added > 0) {
    parts.push(`${counts.added} ditambah`)
  }
  if (counts.removed > 0) {
    parts.push(`${counts.removed} dicabut`)
  }
  return parts.join(' · ')
}

export interface PermissionGroup {
  key: string
  title: string
  items: Permission[]
}

const GROUP_TITLES: Record<string, string> = {
  templates: 'Template',
  invitations: 'Undangan',
  guests: 'Tamu',
  budget: 'Budget',
  membership: 'Membership',
  users: 'Pengguna & Role',
}

// Permission dikelompokkan menurut awalan kode (templates.read -> templates), urutan katalog dipertahankan.
export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups: PermissionGroup[] = []
  for (const permission of permissions) {
    const key = permission.code.split('.')[0] ?? permission.code
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, title: GROUP_TITLES[key] ?? key, items: [] }
      groups.push(group)
    }
    group.items.push(permission)
  }
  return groups
}

export interface MenuGroup {
  key: 'admin' | 'app'
  title: string
  items: CatalogMenu[]
}

// Menu dikelompokkan per area: key berawalan "admin." atau "app.".
export function groupMenus(menus: CatalogMenu[]): MenuGroup[] {
  const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key))
  return [
    { key: 'admin', title: 'Area admin', items: sorted.filter((m) => m.key.startsWith('admin.')) },
    { key: 'app', title: 'Area pelanggan', items: sorted.filter((m) => m.key.startsWith('app.')) },
  ].filter((group) => group.items.length > 0) as MenuGroup[]
}
