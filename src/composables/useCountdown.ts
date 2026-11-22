import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'

interface CountdownOptions {
  /** Sumber waktu (ms); diganti saat test. */
  now?: () => number
  intervalMs?: number
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Hitung mundur ke satu tanggal (ISO 8601). Tanggal tidak valid atau sudah lewat menjadi nol.
export function useCountdown(target: MaybeRefOrGetter<string>, options: CountdownOptions = {}) {
  const now = options.now ?? Date.now
  const current = ref(now())
  const timer = setInterval(() => {
    current.value = now()
  }, options.intervalMs ?? SECOND)
  onScopeDispose(() => clearInterval(timer))

  const remaining = computed(() => {
    const end = Date.parse(toValue(target))
    if (Number.isNaN(end)) {
      return 0
    }
    return Math.max(0, end - current.value)
  })

  return {
    days: computed(() => Math.floor(remaining.value / DAY)),
    hours: computed(() => Math.floor((remaining.value % DAY) / HOUR)),
    minutes: computed(() => Math.floor((remaining.value % HOUR) / MINUTE)),
    seconds: computed(() => Math.floor((remaining.value % MINUTE) / SECOND)),
    isPast: computed(() => remaining.value === 0),
  }
}
