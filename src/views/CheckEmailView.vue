<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { resendVerification } from '@/api/auth'
import { ApiError } from '@/api/http'
import NkIcon from '@/components/NkIcon.vue'
import { ACTIVATION_TTL_TEXT, RESEND_COOLDOWN_SECONDS } from '@/constants/auth'
import { useCooldown } from '@/composables/useCooldown'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useSignupStore } from '@/stores/signup'

useDocumentTitle('Cek email')

const signup = useSignupStore()
const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS)
const resending = ref(false)
const notice = ref('')
const heading = ref<HTMLElement | null>(null)

// Email baru saja dikirim saat daftar, jadi hitung mundur langsung berjalan. Tanpa email di
// memori (halaman dimuat ulang) tidak ada yang bisa dikirim ulang dari sini.
onMounted(() => {
  heading.value?.focus()
  if (signup.pendingEmail) {
    cooldown.start()
  }
})

async function resend(): Promise<void> {
  const email = signup.pendingEmail
  if (!email || resending.value || cooldown.active.value) {
    return
  }
  resending.value = true
  notice.value = ''
  try {
    await resendVerification(email)
    notice.value = 'Email baru sudah dikirim. Cek kotak masuk dan folder spam.'
    cooldown.start()
  } catch (error) {
    notice.value =
      error instanceof ApiError && error.status === 429
        ? 'Terlalu banyak permintaan. Coba lagi nanti.'
        : 'Belum bisa mengirim email. Coba lagi sebentar lagi.'
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="nk-auth__center">
      <span class="nk-auth__icon nk-auth__icon--brand"><NkIcon name="mail" :size="32" /></span>
      <h1 ref="heading" class="nk-auth__title" tabindex="-1">Cek email-mu</h1>

      <template v-if="signup.pendingEmail">
        <p class="nk-auth__lead">Kami mengirim tautan aktivasi ke</p>
        <p class="nk-auth__email" data-testid="pending-email">{{ signup.pendingEmail }}</p>
      </template>
      <p v-else class="nk-auth__lead">
        Kami mengirim tautan aktivasi ke email yang kamu daftarkan.
      </p>
      <p class="nk-auth__lead">
        Tautan berlaku {{ ACTIVATION_TTL_TEXT }} dan hanya bisa dipakai sekali. Belum tiba? Cek
        folder spam.
      </p>
    </div>

    <section v-if="signup.pendingEmail" class="nk-auth__box" aria-labelledby="resend-title">
      <h2 id="resend-title" class="nk-auth__boxtitle">Email belum tiba?</h2>
      <button
        type="button"
        class="nk-btn nk-btn--outline nk-btn--block"
        :disabled="resending || cooldown.active.value"
        @click="resend"
      >
        {{ resending ? 'Mengirim…' : 'Kirim ulang email' }}
        <NkIcon name="refresh-cw" :size="16" />
      </button>
      <p v-if="cooldown.active.value" class="nk-auth__hint" data-testid="resend-countdown">
        Kirim ulang tersedia dalam {{ cooldown.label.value }}
      </p>
      <p v-if="notice" class="nk-auth__hint" role="status">{{ notice }}</p>
    </section>

    <p v-else class="nk-auth__switch">
      Belum menerima email?
      <RouterLink to="/aktivasi">Minta tautan baru</RouterLink>
    </p>

    <p class="nk-auth__switch">
      Salah alamat email?
      <RouterLink :to="{ name: 'register' }">Ubah</RouterLink>
    </p>
    <p class="nk-auth__switch">
      Sudah aktif?
      <RouterLink :to="{ name: 'login' }">Masuk</RouterLink>
    </p>
  </AuthLayout>
</template>
