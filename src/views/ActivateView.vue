<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { resendVerification, verifyEmail } from '@/api/auth'
import { ApiError } from '@/api/http'
import NkIcon from '@/components/NkIcon.vue'
import { ACTIVATION_TTL_TEXT, RESEND_COOLDOWN_SECONDS } from '@/constants/auth'
import { useCooldown } from '@/composables/useCooldown'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { validateEmail } from '@/utils/validation'
import AuthAlert from './auth/AuthAlert.vue'
import AuthField from './auth/AuthField.vue'

useDocumentTitle('Aktivasi akun')

// Token aktivasi: 32 byte base64url tanpa padding (43 karakter), sesuai backend.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

type Phase = 'processing' | 'success' | 'invalid' | 'failed'
const phase = ref<Phase>('processing')

// Token hanya disimpan di variabel ini (untuk "Coba lagi"); tidak masuk state reaktif, URL,
// storage, maupun log.
let pendingToken: string | null = null

const heading = ref<HTMLElement | null>(null)
const email = ref('')
const emailError = ref('')
const emailField = ref<InstanceType<typeof AuthField> | null>(null)
const resending = ref(false)
const notice = ref('')
const noticeTone = ref<'success' | 'danger'>('success')
const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS)

// Baca token dari fragment lalu hapus dari URL sebelum request apa pun.
function takeTokenFromUrl(): string | null {
  const hash = window.location.hash
  if (!hash) {
    return null
  }
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token')
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  )
  return token
}

async function activate(): Promise<void> {
  const token = pendingToken
  if (!token || !TOKEN_PATTERN.test(token)) {
    pendingToken = null
    phase.value = 'invalid'
    return
  }
  phase.value = 'processing'
  try {
    await verifyEmail(token)
    pendingToken = null
    phase.value = 'success'
  } catch (error) {
    // Satu hasil untuk token salah format, tidak dikenal, kedaluwarsa, atau sudah dipakai.
    if (error instanceof ApiError && error.status === 400) {
      pendingToken = null
      phase.value = 'invalid'
    } else {
      phase.value = 'failed'
    }
  }
}

onMounted(() => {
  pendingToken = takeTokenFromUrl()
  void activate()
})

watch(phase, async () => {
  await nextTick()
  heading.value?.focus()
})

async function resend(): Promise<void> {
  if (resending.value || cooldown.active.value) {
    return
  }
  emailError.value = validateEmail(email.value)
  if (emailError.value) {
    emailField.value?.focus()
    return
  }
  resending.value = true
  notice.value = ''
  try {
    await resendVerification(email.value.trim())
    noticeTone.value = 'success'
    notice.value = 'Jika akunmu perlu diaktifkan, kami sudah mengirim tautan baru. Cek email-mu.'
    cooldown.start()
  } catch (error) {
    noticeTone.value = 'danger'
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
    <div class="nk-auth__center" aria-live="polite">
      <template v-if="phase === 'processing'">
        <span class="nk-auth__icon nk-auth__icon--brand">
          <NkIcon class="nk-spin" name="loader" :size="32" />
        </span>
        <h1 ref="heading" class="nk-auth__title" tabindex="-1">Mengaktifkan akunmu…</h1>
        <p class="nk-auth__lead">Sebentar ya, jangan tutup halaman ini.</p>
        <div class="nk-progress" aria-hidden="true"><span></span></div>
      </template>

      <template v-else-if="phase === 'success'">
        <span class="nk-auth__icon nk-auth__icon--success"><NkIcon name="check" :size="32" /></span>
        <h1 ref="heading" class="nk-auth__title" tabindex="-1">Akunmu sudah aktif</h1>
        <p class="nk-auth__lead">Sekarang kamu bisa masuk dan mulai menyusun undangan kalian.</p>
        <RouterLink class="nk-btn nk-btn--primary nk-btn--block" :to="{ name: 'login' }">
          Masuk sekarang
          <NkIcon name="arrow-right" :size="18" />
        </RouterLink>
      </template>

      <template v-else-if="phase === 'failed'">
        <span class="nk-auth__icon nk-auth__icon--warning">
          <NkIcon name="alert-triangle" :size="32" />
        </span>
        <h1 ref="heading" class="nk-auth__title" tabindex="-1">Belum bisa memverifikasi</h1>
        <p class="nk-auth__lead">
          Terjadi kendala saat memeriksa tautan. Periksa koneksi lalu coba lagi.
        </p>
        <button type="button" class="nk-btn nk-btn--primary nk-btn--block" @click="activate">
          Coba lagi
        </button>
      </template>

      <template v-else>
        <span class="nk-auth__icon nk-auth__icon--warning">
          <NkIcon name="hourglass" :size="32" />
        </span>
        <h1 ref="heading" class="nk-auth__title" tabindex="-1">Tautan sudah tidak berlaku</h1>
        <p class="nk-auth__lead">
          Tautan aktivasi berlaku {{ ACTIVATION_TTL_TEXT }} dan hanya bisa dipakai sekali. Minta
          tautan baru di bawah ini.
        </p>
      </template>
    </div>

    <form v-if="phase === 'invalid'" class="nk-authform" novalidate @submit.prevent="resend">
      <AuthAlert v-if="notice" :tone="noticeTone">{{ notice }}</AuthAlert>
      <AuthField
        id="activate-email"
        ref="emailField"
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="emailError"
        :disabled="resending"
      />
      <button
        type="submit"
        class="nk-btn nk-btn--primary nk-btn--block"
        :disabled="resending || cooldown.active.value"
      >
        {{ resending ? 'Mengirim…' : 'Kirim tautan baru' }}
        <NkIcon v-if="!resending" name="send" :size="16" />
      </button>
      <p v-if="cooldown.active.value" class="nk-auth__hint">
        Kirim ulang tersedia dalam {{ cooldown.label.value }}
      </p>
      <p class="nk-auth__switch">
        Ingat kata sandimu?
        <RouterLink :to="{ name: 'login' }">Masuk</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>
