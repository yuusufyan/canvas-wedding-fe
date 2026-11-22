// Draf kontrak dashboard admin (TODO(BE): endpoint belum ada; bentuk disamakan dengan Swagger nanti).
export interface InvitationStats {
  invitations_active: number
  invitations_new_30d: number
}

export interface RegistrationWeek {
  label: string
  count: number
}

export interface TopTemplate {
  name: string
  invitations: number
}

export type ActivityKind =
  'login_failed' | 'permission_changed' | 'template_archived' | 'user_created'

// Hanya jenis kejadian dan waktu; tanpa IP atau email lengkap.
export interface ActivityEvent {
  id: string
  kind: ActivityKind
  message: string
  occurred_at: string
}
