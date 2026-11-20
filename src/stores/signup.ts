import { defineStore } from 'pinia'
import { ref } from 'vue'

// Email yang baru didaftarkan, hanya untuk halaman Cek Email. Sengaja hanya di memori:
// tidak di URL, localStorage, maupun sessionStorage, sehingga hilang saat halaman dimuat ulang.
export const useSignupStore = defineStore('signup', () => {
  const pendingEmail = ref<string | null>(null)

  function remember(email: string): void {
    pendingEmail.value = email
  }

  function forget(): void {
    pendingEmail.value = null
  }

  return { pendingEmail, remember, forget }
})
