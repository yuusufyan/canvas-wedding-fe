import { onScopeDispose, ref, type Ref } from 'vue'

// Titik henti Bootstrap 5.1 (sama dengan CSS Niskala).
export const BREAKPOINTS = { sm: 576, md: 768, lg: 992, xl: 1200 } as const

// True bila lebar viewport >= min. Tanpa matchMedia (mis. jsdom) dianggap layar lebar.
export function useMinWidth(min: number): Ref<boolean> {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return ref(true)
  }
  const query = window.matchMedia(`(min-width: ${min}px)`)
  const matches = ref(query.matches)
  const onChange = (event: MediaQueryListEvent): void => {
    matches.value = event.matches
  }
  query.addEventListener('change', onChange)
  onScopeDispose(() => query.removeEventListener('change', onChange))
  return matches
}
