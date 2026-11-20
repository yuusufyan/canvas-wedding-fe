import { readonly, ref } from 'vue'

export type ToastTone = 'success' | 'error'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

const TOAST_DURATION_MS = 4500
const MAX_TOASTS = 3

const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(tone: ToastTone, message: string): void {
  const id = nextId++
  toasts.value = [...toasts.value, { id, tone, message }].slice(-MAX_TOASTS)
  setTimeout(() => dismiss(id), TOAST_DURATION_MS)
}

// Antrean toast bersama; ditampilkan oleh ToastHost di shell aplikasi.
export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    dismiss,
  }
}
