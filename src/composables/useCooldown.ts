import { computed, onScopeDispose, ref } from 'vue'
import { formatClock } from './usePlayer'

// Hitung mundur untuk tombol kirim ulang (detik). start() memulai ulang dari awal.
export function useCooldown(seconds: number) {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function stop(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start(): void {
    stop()
    remaining.value = seconds
    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        remaining.value = 0
        stop()
      }
    }, 1000)
  }

  onScopeDispose(stop)

  return {
    remaining,
    active: computed(() => remaining.value > 0),
    label: computed(() => formatClock(remaining.value)),
    start,
  }
}
