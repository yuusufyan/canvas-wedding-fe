import type { NkIconName } from '@/constants/nk-icons'

// Nama ikon dari backend (kolom menus.icon) dipetakan ke ikon yang tersedia; yang tidak
// dikenal memakai ikon bawaan.
export const MENU_ICONS: Record<string, NkIconName> = {
  grid: 'grid',
  layout: 'layout',
  mail: 'mail',
  users: 'users',
  'user-cog': 'user',
  'credit-card': 'crown',
  settings: 'settings',
  home: 'home',
  wallet: 'wallet',
}

export const MENU_ICON_FALLBACK: NkIconName = 'grid'
