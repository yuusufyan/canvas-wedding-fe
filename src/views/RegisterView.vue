<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { ApiError } from '@/api/http'
import NkIcon from '@/components/NkIcon.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useSignupStore } from '@/stores/signup'
import { validateEmail, validateName, validateNewPassword } from '@/utils/validation'
import AuthAlert from './auth/AuthAlert.vue'
import AuthField from './auth/AuthField.vue'
import PasswordStrength from './auth/PasswordStrength.vue'

useDocumentTitle('Daftar')

const router = useRouter()
const signup = useSignupStore()

const name = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)

const nameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const alertMessage = ref('')

const nameField = ref<InstanceType<typeof AuthField> | null>(null)
const emailField = ref<InstanceType<typeof AuthField> | null>(null)
const passwordField = ref<InstanceType<typeof AuthField> | null>(null)

function validate(): boolean {
  nameError.value = validateName(name.value)
  emailError.value = validateEmail(email.value)
  passwordError.value = validateNewPassword(password.value)

  if (nameError.value) {
    nameField.value?.focus()
  } else if (emailError.value) {
    emailField.value?.focus()
  } else if (passwordError.value) {
    passwordField.value?.focus()
  }
  return !nameError.value && !emailError.value && !passwordError.value
}

function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Terlalu banyak percobaan. Coba lagi nanti.'
    }
    if (error.status === 400) {
      return 'Periksa kembali data yang dimasukkan.'
    }
    if (error.status === 0) {
      return 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'
    }
  }
  return 'Terjadi kesalahan, silakan coba lagi.'
}

// Jawaban backend selalu 202 identik, baik untuk email baru maupun yang sudah terdaftar,
// jadi halaman ini tidak pernah menyebut apakah email sudah dipakai.
async function handleSubmit(): Promise<void> {
  if (submitting.value) {
    return
  }
  alertMessage.value = ''
  if (!validate()) {
    return
  }

  submitting.value = true
  try {
    await register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    signup.remember(email.value.trim())
    await router.push({ name: 'check-email' })
  } catch (error) {
    alertMessage.value = describeFailure(error)
  } finally {
    password.value = ''
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="nk-auth__title">Mulai undanganmu hari ini</h1>
    <p class="nk-auth__lead">Gratis untuk 1 undangan. Tanpa kartu kredit.</p>

    <AuthAlert v-if="alertMessage" tone="danger">{{ alertMessage }}</AuthAlert>

    <form class="nk-authform" novalidate @submit.prevent="handleSubmit">
      <AuthField
        id="register-name"
        ref="nameField"
        v-model="name"
        label="Nama lengkap"
        autocomplete="name"
        :maxlength="100"
        :error="nameError"
        :disabled="submitting"
      />
      <AuthField
        id="register-email"
        ref="emailField"
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="emailError"
        :disabled="submitting"
      />
      <AuthField
        id="register-password"
        ref="passwordField"
        v-model="password"
        label="Kata sandi"
        type="password"
        autocomplete="new-password"
        revealable
        :error="passwordError"
        :disabled="submitting"
      >
        <PasswordStrength :value="password" />
      </AuthField>

      <button type="submit" class="nk-btn nk-btn--primary nk-btn--block" :disabled="submitting">
        {{ submitting ? 'Membuat akun…' : 'Buat akun gratis' }}
        <NkIcon v-if="!submitting" name="arrow-right" :size="18" />
      </button>
    </form>

    <p class="nk-auth__switch">
      Sudah punya akun?
      <RouterLink :to="{ name: 'login' }">Masuk</RouterLink>
    </p>
  </AuthLayout>
</template>
