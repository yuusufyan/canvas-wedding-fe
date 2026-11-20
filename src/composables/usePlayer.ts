import { computed, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

interface PlayerOptions {
  totalSeconds: MaybeRefOrGetter<number>
  pageCount: MaybeRefOrGetter<number>
  /** Mulai memutar otomatis; dimatikan bila pengguna meminta gerak dikurangi. */
  autoStart?: boolean
  tickMs?: number
}

// Selisih kecil agar posisi tetap berada di dalam bagian saat pemutaran berhenti di batasnya.
const BOUNDARY_EPSILON = 0.001
const RESTART_THRESHOLD_SECONDS = 2

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const mm = String(Math.floor(whole / 60)).padStart(2, '0')
  const ss = String(whole % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// Pemutar demo: waktu dibagi rata ke tiap bagian (halaman).
export function usePlayer(options: PlayerOptions) {
  const elapsed = ref(0)
  const playing = ref(options.autoStart ?? false)
  const auto = ref(true)

  const total = computed(() => Math.max(0, toValue(options.totalSeconds)))
  const count = computed(() => Math.max(1, toValue(options.pageCount)))
  const segment = computed(() => total.value / count.value)

  const currentIndex = computed(() => {
    if (segment.value === 0) {
      return 0
    }
    return Math.min(count.value - 1, Math.floor(elapsed.value / segment.value))
  })

  function progressOf(index: number): number {
    if (segment.value === 0) {
      return 0
    }
    return Math.min(1, Math.max(0, (elapsed.value - index * segment.value) / segment.value))
  }

  function seek(seconds: number): void {
    elapsed.value = Math.min(total.value, Math.max(0, seconds))
  }

  function seekToPage(index: number): void {
    const clamped = Math.min(count.value - 1, Math.max(0, index))
    seek(clamped * segment.value)
  }

  function advance(deltaSeconds: number): void {
    if (!playing.value) {
      return
    }
    const target = elapsed.value + deltaSeconds
    if (target >= total.value) {
      elapsed.value = total.value
      playing.value = false
      return
    }
    const boundary = (currentIndex.value + 1) * segment.value
    if (!auto.value && target >= boundary) {
      elapsed.value = boundary - BOUNDARY_EPSILON
      playing.value = false
      return
    }
    elapsed.value = target
  }

  function play(): void {
    if (elapsed.value >= total.value) {
      elapsed.value = 0
    }
    playing.value = true
  }

  function pause(): void {
    playing.value = false
  }

  function toggle(): void {
    if (playing.value) {
      pause()
    } else {
      play()
    }
  }

  function next(): void {
    seekToPage(currentIndex.value + 1)
  }

  function prev(): void {
    const intoPage = elapsed.value - currentIndex.value * segment.value
    seekToPage(intoPage > RESTART_THRESHOLD_SECONDS ? currentIndex.value : currentIndex.value - 1)
  }

  let timer: ReturnType<typeof setInterval> | null = null
  let lastTick = 0

  function stopTimer(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(
    playing,
    (isPlaying) => {
      stopTimer()
      if (!isPlaying) {
        return
      }
      lastTick = Date.now()
      timer = setInterval(() => {
        const nowMs = Date.now()
        advance((nowMs - lastTick) / 1000)
        lastTick = nowMs
      }, options.tickMs ?? 100)
    },
    { immediate: true },
  )
  onScopeDispose(stopTimer)

  return {
    elapsed,
    playing,
    auto,
    total,
    count,
    currentIndex,
    progressOf,
    seek,
    seekToPage,
    advance,
    play,
    pause,
    toggle,
    next,
    prev,
  }
}
