import { API_BASE_PATH } from '@/constants/api'
import type { ActivityEvent, RegistrationWeek, TopTemplate } from '@/types/dashboard'
import { guard, ok, type MockHandler } from './http'

// Data contoh dashboard admin (fiktif). Template dan membership memakai mock yang sudah ada.
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const WEEKS = ['Okt 19', 'Okt 26', 'Nov 2', 'Nov 9', 'Nov 16']
const COUNTS = [2, 3, 5, 4, 4]

function registrations(): RegistrationWeek[] {
  return WEEKS.map((label, index) => ({ label, count: COUNTS[index]! }))
}

const TOP_TEMPLATES: TopTemplate[] = [
  { name: 'Rustic Hijau', invitations: 58 },
  { name: 'Elegan Putih', invitations: 44 },
  { name: 'Floral Blush', invitations: 31 },
  { name: 'Minimalis Modern', invitations: 22 },
  { name: 'Garden Sage', invitations: 14 },
]

function activity(): ActivityEvent[] {
  const now = Date.now()
  const at = (ms: number) => new Date(now - ms).toISOString()
  return [
    {
      id: 'e1',
      kind: 'login_failed',
      message: '3 login gagal beruntun dari satu IP',
      occurred_at: at(10 * MINUTE),
    },
    {
      id: 'e2',
      kind: 'permission_changed',
      message: 'Izin role Operator diubah (+2, −1)',
      occurred_at: at(HOUR),
    },
    {
      id: 'e3',
      kind: 'template_archived',
      message: 'Template Batik Klasik diarsipkan',
      occurred_at: at(3 * HOUR),
    },
    {
      id: 'e4',
      kind: 'user_created',
      message: 'Pengguna baru: Gita Maharani',
      occurred_at: at(DAY),
    },
  ]
}

const DASHBOARD = `${API_BASE_PATH}/dashboard`

export const handleDashboard: MockHandler = (request) => {
  if (!request.url.pathname.startsWith(`${DASHBOARD}/`) || request.method !== 'GET') {
    return null
  }
  const blocked = guard(request)
  if (blocked) {
    return blocked
  }
  const empty = window.__nkMock === 'empty'
  switch (request.url.pathname.slice(DASHBOARD.length)) {
    case '/invitations':
      return ok({ invitations_active: empty ? 0 : 128, invitations_new_30d: empty ? 0 : 19 })
    case '/registrations':
      return ok(empty ? [] : registrations())
    case '/top-templates':
      return ok(empty ? [] : TOP_TEMPLATES)
    case '/activity':
      return ok(empty ? [] : activity())
    default:
      return null
  }
}
