// Samarkan email untuk tampilan (Confidential): n***@contoh.test. Email yang sudah tersamar
// dari backend dikembalikan apa adanya.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at <= 0) {
    return '***'
  }
  const local = email.slice(0, at)
  if (local.includes('*')) {
    return email
  }
  return `${local.charAt(0)}***${email.slice(at)}`
}
