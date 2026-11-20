<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { resendVerification } from '@/api/auth'
import { ApiError } from '@/api/http'
import NkIcon from '@/components/NkIcon.vue'
import { LOGIN_RATE_LIMIT_TEXT, RESEND_COOLDOWN_SECONDS } from '@/constants/auth'
import { useCooldown } from '@/composables/useCooldown'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { validateEmail } from '@/utils/validation'
import AuthAlert from './auth/AuthAlert.vue'
import AuthField from './auth/AuthField.vue'

useDocumentTitle('Masuk')

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)

const emailError = ref('')
const passwordError = ref('')

interface LoginAlert {
  tone: 'info' | 'danger' | 'warning'
  message: string
}
const alert = ref<LoginAlert | null>(null)

const resending = ref(false)
const resendNotice = ref('')
const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS)

const emailField = ref<InstanceType<typeof AuthField> | null>(null)
const passwordField = ref<InstanceType<typeof AuthField> | null>(null)

const showResend = computed(() => alert.value?.tone === 'warning')

onMounted(() => {
  if (authStore.consumeSessionExpiredNotice()) {
    alert.value = { tone: 'info', message: 'Sesi Anda telah berakhir, silakan masuk kembali.' }
  }
})

function validate(): boolean {
  emailError.value = validateEmail(email.value)
  passwordError.value = password.value ? '' : 'Kata sandi wajib diisi.'

  if (emailError.value) {
    emailField.value?.focus()
    return false
  }
  if (passwordError.value) {
    passwordField.value?.focus()
    return false
  }
  return true
}

// 401 selalu satu pesan generik (tidak membedakan email tidak ada dan kata sandi salah).
// 403 hanya muncul bila kata sandi benar tetapi email belum diaktivasi.
function toAlert(error: unknown): LoginAlert {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { tone: 'danger', message: 'Email atau kata sandi salah' }
    }
    if (error.status === 403) {
      return {
        tone: 'warning',
        message: 'Akunmu belum diaktifkan. Cek email-mu untuk tautan aktivasi.',
      }
    }
    if (error.status === 429) {
      return { tone: 'danger', message: LOGIN_RATE_LIMIT_TEXT }
    }
    if (error.status === 400) {
      return { tone: 'danger', message: 'Periksa kembali data yang dimasukkan.' }
    }
    if (error.status === 0) {
      return {
        tone: 'danger',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.',
      }
    }
  }
  return { tone: 'danger', message: 'Terjadi kesalahan, silakan coba lagi.' }
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) {
    return
  }

  alert.value = null
  resendNotice.value = ''
  if (!validate()) {
    return
  }

  submitting.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    // SuperAdmin ke halaman admin yang ada; role lain ke area pelanggan.
    await router.push(authStore.isSuperAdmin ? { name: 'home' } : '/app')
  } catch (error) {
    alert.value = toAlert(error)
  } finally {
    password.value = ''
    submitting.value = false
  }
}

// Jawaban kirim ulang selalu sama (202) sehingga tidak membocorkan keberadaan akun.
async function handleResend(): Promise<void> {
  if (resending.value || cooldown.active.value) {
    return
  }
  const problem = validateEmail(email.value)
  if (problem) {
    emailError.value = problem
    emailField.value?.focus()
    return
  }
  resending.value = true
  resendNotice.value = ''
  try {
    await resendVerification(email.value.trim())
    resendNotice.value =
      'Jika akunmu perlu diaktifkan, kami sudah mengirim email baru. Cek email-mu.'
    cooldown.start()
  } catch (error) {
    resendNotice.value =
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
    <h1 class="nk-auth__title">Selamat datang kembali</h1>
    <p class="nk-auth__lead">Masuk untuk melanjutkan menyusun undangan kalian.</p>

    <AuthAlert v-if="alert" :tone="alert.tone">
      {{ alert.message }}
      <template v-if="showResend">
        <button
          type="button"
          class="nk-alert__action"
          :disabled="resending || cooldown.active.value"
          @click="handleResend"
        >
          {{ resending ? 'Mengirim…' : 'Kirim ulang tautan' }}
        </button>
        <span v-if="cooldown.active.value" class="nk-alert__note">
          Tersedia lagi dalam {{ cooldown.label.value }}
        </span>
        <span v-if="resendNotice" class="nk-alert__note" role="status">{{ resendNotice }}</span>
      </template>
    </AuthAlert>

    <form class="nk-authform" method="post" novalidate @submit.prevent="handleSubmit">
      <AuthField
        id="login-email"
        ref="emailField"
        v-model="email"
        label="Email"
        type="email"
        autocomplete="username email"
        placeholder="nama@contoh.test"
        :error="emailError"
        :disabled="submitting"
      />
      <AuthField
        id="login-password"
        ref="passwordField"
        v-model="password"
        label="Kata sandi"
        type="password"
        autocomplete="current-password"
        placeholder="············"
        revealable
        :error="passwordError"
        :disabled="submitting"
      />

      <button type="submit" class="nk-btn nk-btn--primary nk-btn--block" :disabled="submitting">
        {{ submitting ? 'Masuk…' : 'Masuk' }}
        <NkIcon v-if="!submitting" name="arrow-right" :size="18" />
      </button>
    </form>

    <p class="nk-auth__switch">
      Belum punya akun?
      <RouterLink :to="{ name: 'register' }">Daftar gratis</RouterLink>
    </p>
  </AuthLayout>
</template>
