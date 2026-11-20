const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY

const numberFormatter = new Intl.NumberFormat('id-ID')

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

// "2 hari lalu", "1 minggu lalu"; tanggal tidak valid dikembalikan apa adanya.
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) {
    return iso
  }
  const diff = Math.max(0, now - time)
  if (diff < MINUTE) {
    return 'baru saja'
  }
  const units: [number, string][] = [
    [MONTH, 'bulan'],
    [WEEK, 'minggu'],
    [DAY, 'hari'],
    [HOUR, 'jam'],
    [MINUTE, 'menit'],
  ]
  for (const [size, label] of units) {
    if (diff >= size) {
      return `${Math.floor(diff / size)} ${label} lalu`
    }
  }
  return 'baru saja'
}
