// Aturan kata sandi backend: 8 sampai 72 byte (batas bcrypt), dihitung dalam byte UTF-8.
export const PASSWORD_MIN_BYTES = 8
export const PASSWORD_MAX_BYTES = 72

const encoder = new TextEncoder()

export function passwordBytes(value: string): number {
  return encoder.encode(value).length
}

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

// Indikator saran saja, bukan aturan penerimaan. Menilai panjang (byte) dan ragam karakter.
export function passwordStrength(value: string): StrengthLevel {
  if (!value) {
    return 0
  }
  const bytes = passwordBytes(value)
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length
  const score =
    (bytes >= PASSWORD_MIN_BYTES ? 1 : 0) +
    (bytes >= 12 ? 1 : 0) +
    (classes >= 2 ? 1 : 0) +
    (classes >= 3 ? 1 : 0)
  return Math.max(1, score) as StrengthLevel
}

export const STRENGTH_TEXT: Record<StrengthLevel, string> = {
  0: '',
  1: 'Lemah. Tambah panjang atau variasi karakter.',
  2: 'Cukup. Tambah panjang atau variasi karakter.',
  3: 'Kuat',
  4: 'Sangat kuat',
}
