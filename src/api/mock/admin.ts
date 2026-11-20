import { API_BASE_PATH } from '@/constants/api'
import type {
  AdminTemplate,
  Membership,
  MembershipPlan,
  MembershipStatus,
  MembershipSummary,
  TemplateCounts,
  TemplateStatus,
} from '@/types/admin'
import type { TemplateAccess } from '@/types/invitation-document'
import { fail, guard, ok, paginate, type MockHandler } from './http'
import { mockCover, mockThemeInfo } from './templates'

// Data contoh (fiktif) untuk admin template dan membership; hanya di memori, hilang saat
// halaman dimuat ulang.
const DAY = 24 * 60 * 60 * 1000

function ago(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString()
}

function fromNow(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString()
}

function template(
  slug: string,
  status: TemplateStatus,
  pages: number,
  updatedDaysAgo: number,
  inUse: number,
): AdminTemplate {
  const info = mockThemeInfo(slug)!
  return {
    id: `tpl-${slug}`,
    slug,
    name: info.name,
    access: info.access,
    status,
    page_count: pages,
    in_use_count: inUse,
    updated_at: ago(updatedDaysAgo),
    cover: mockCover(slug),
  }
}

let templates: AdminTemplate[] = [
  template('rustic-hijau', 'Terbit', 9, 2, 14),
  template('elegan-putih', 'Terbit', 8, 5, 12),
  template('floral-blush', 'Draft', 7, 7, 0),
  template('minimalis-modern', 'Terbit', 6, 14, 3),
  template('midnight-gold', 'Terbit', 9, 21, 5),
  template('batik-klasik', 'Draft', 10, 30, 0),
  template('garden-sage', 'Terbit', 8, 30, 2),
  template('ocean-dusk', 'Arsip', 7, 60, 0),
]

const NAMES = [
  'Nadia Pratama',
  'Bagas Wicaksono',
  'Citra Lestari',
  'Dimas Anggara',
  'Eka Puspita',
  'Fajar Nugroho',
  'Gita Maharani',
  'Hana Kusuma',
  'Indra Saputra',
  'Jihan Permata',
  'Kevin Hartono',
  'Laras Wulandari',
]

const PATTERN: { plan: MembershipPlan; status: MembershipStatus; expiresIn: number | null }[] = [
  { plan: 'Premium', status: 'Aktif', expiresIn: 114 },
  { plan: 'Premium', status: 'Segera berakhir', expiresIn: 4 },
  { plan: 'Premium', status: 'Trial', expiresIn: 7 },
  { plan: 'Gratis', status: 'Aktif', expiresIn: null },
  { plan: 'Premium', status: 'Kedaluwarsa', expiresIn: -18 },
  { plan: 'Gratis', status: 'Aktif', expiresIn: null },
  { plan: 'Premium', status: 'Aktif', expiresIn: 220 },
]

function buildMemberships(): Membership[] {
  return Array.from({ length: 34 }, (_, index) => {
    const base = PATTERN[index % PATTERN.length]!
    const name = NAMES[index % NAMES.length]!
    const quota = base.plan === 'Premium' ? 10 : 1
    return {
      id: `mem-${index + 1}`,
      user_name: index < NAMES.length ? name : `${name} ${Math.floor(index / NAMES.length) + 1}`,
      email: `${name.charAt(0).toLowerCase()}***@contoh.test`,
      plan: base.plan,
      status: base.status,
      expires_at: base.expiresIn === null ? null : fromNow(base.expiresIn),
      invitations_used: Math.min(quota, (index * 3) % (quota + 1)),
      invitations_quota: quota,
    }
  })
}

const memberships = buildMemberships()

function counts(): TemplateCounts {
  return {
    all: templates.length,
    published: templates.filter((t) => t.status === 'Terbit').length,
    draft: templates.filter((t) => t.status === 'Draft').length,
    archived: templates.filter((t) => t.status === 'Arsip').length,
  }
}

function summary(): MembershipSummary {
  const by = (status: MembershipStatus) => memberships.filter((m) => m.status === status)
  return {
    total: memberships.length,
    active: by('Aktif').length,
    trial: by('Trial').length,
    trial_expiring_soon: by('Trial').filter(
      (m) => m.expires_at && Date.parse(m.expires_at) < Date.now() + 7 * DAY,
    ).length,
    expiring_soon: by('Segera berakhir').length,
    expired: by('Kedaluwarsa').length,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const TEMPLATES = `${API_BASE_PATH}/templates`
const MEMBERSHIPS = `${API_BASE_PATH}/memberships`

function listTemplates(url: URL): Response {
  const status = url.searchParams.get('status')
  const access = url.searchParams.get('access')
  const q = url.searchParams.get('q')?.toLowerCase()
  let rows = window.__nkMock === 'empty' ? [] : [...templates]
  rows = rows.filter(
    (row) =>
      (!status || row.status === status) &&
      (!access || row.access === access) &&
      (!q || row.name.toLowerCase().includes(q)),
  )
  rows.sort((a, b) =>
    url.searchParams.get('sort') === 'name_asc'
      ? a.name.localeCompare(b.name)
      : Date.parse(b.updated_at) - Date.parse(a.updated_at),
  )
  return paginate(rows, url, 12)
}

function mutateTemplate(id: string, change: (row: AdminTemplate) => void): Response {
  const row = templates.find((item) => item.id === id)
  if (!row) {
    return fail(404, 'Not Found')
  }
  change(row)
  row.updated_at = new Date().toISOString()
  return ok(row)
}

function handleTemplates({ url, method, body }: Parameters<MockHandler>[0]): Response | null {
  const rest = url.pathname.slice(TEMPLATES.length)
  const fields = (body ?? {}) as Record<string, unknown>

  if (rest === '' && method === 'GET') {
    return listTemplates(url)
  }
  if (rest === '/counts' && method === 'GET') {
    return ok(
      window.__nkMock === 'empty' ? { all: 0, published: 0, draft: 0, archived: 0 } : counts(),
    )
  }
  if (rest === '' && method === 'POST') {
    const name = typeof fields.name === 'string' ? fields.name.trim() : ''
    const access = fields.access === 'Premium' ? 'Premium' : 'Gratis'
    if (!name || name.length > 60) {
      return fail(400, 'Bad Request')
    }
    if (templates.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return fail(409, 'Conflict')
    }
    const created: AdminTemplate = {
      id: `tpl-${Date.now()}`,
      slug: slugify(name) || 'template-baru',
      name,
      access: access as TemplateAccess,
      status: 'Draft',
      page_count: 1,
      in_use_count: 0,
      updated_at: new Date().toISOString(),
      cover: { ...mockCover('minimalis-modern'), id: 'cover' },
    }
    templates = [created, ...templates]
    return ok(created)
  }

  const match = /^\/([^/]+)(?:\/(publish|archive))?$/.exec(rest)
  const id = match?.[1] ? decodeURIComponent(match[1]) : null
  if (!id) {
    return null
  }
  const action = match?.[2]
  if (method === 'POST' && action === 'publish') {
    return mutateTemplate(id, (row) => (row.status = 'Terbit'))
  }
  if (method === 'POST' && action === 'archive') {
    return mutateTemplate(id, (row) => (row.status = 'Arsip'))
  }
  if (method === 'PATCH' && !action) {
    return mutateTemplate(id, (row) => {
      if (fields.access === 'Gratis' || fields.access === 'Premium') {
        row.access = fields.access
      }
      if (typeof fields.name === 'string' && fields.name.trim()) {
        row.name = fields.name.trim()
      }
    })
  }
  if (method === 'DELETE' && !action) {
    const row = templates.find((item) => item.id === id)
    if (!row) {
      return fail(404, 'Not Found')
    }
    if (row.in_use_count > 0) {
      return fail(409, 'Conflict')
    }
    templates = templates.filter((item) => item.id !== id)
    return new Response(null, { status: 204 })
  }
  return null
}

function handleMemberships({ url, method }: Parameters<MockHandler>[0]): Response | null {
  const rest = url.pathname.slice(MEMBERSHIPS.length)
  if (method !== 'GET') {
    return null
  }
  if (rest === '/summary') {
    return ok(
      window.__nkMock === 'empty'
        ? { total: 0, active: 0, trial: 0, trial_expiring_soon: 0, expiring_soon: 0, expired: 0 }
        : summary(),
    )
  }
  if (rest !== '') {
    return null
  }
  const status = url.searchParams.get('status')
  const q = url.searchParams.get('q')?.toLowerCase()
  const rows =
    window.__nkMock === 'empty'
      ? []
      : memberships.filter(
          (row) =>
            (!status || row.status === status) && (!q || row.user_name.toLowerCase().includes(q)),
        )
  return paginate(rows, url, 10)
}

export const handleAdmin: MockHandler = (request) => {
  const { pathname } = request.url
  const isTemplates = pathname === TEMPLATES || pathname.startsWith(`${TEMPLATES}/`)
  const isMemberships = pathname === MEMBERSHIPS || pathname.startsWith(`${MEMBERSHIPS}/`)
  if (!isTemplates && !isMemberships) {
    return null
  }
  return guard(request) ?? (isTemplates ? handleTemplates(request) : handleMemberships(request))
}
