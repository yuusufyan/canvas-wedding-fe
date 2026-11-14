<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import FeatherIcon from '@/components/FeatherIcon.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)

const emailError = ref('')
const passwordError = ref('')
const alert = ref<{ variant: 'danger' | 'info'; message: string } | null>(null)

const emailInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

onMounted(() => {
  if (authStore.consumeSessionExpiredNotice()) {
    alert.value = { variant: 'info', message: 'Sesi Anda telah berakhir, silakan masuk kembali.' }
  }
})

function validate(): boolean {
  const trimmed = email.value.trim()
  if (!trimmed) {
    emailError.value = 'Email wajib diisi.'
  } else if (!EMAIL_PATTERN.test(trimmed)) {
    emailError.value = 'Format email belum valid.'
  } else {
    emailError.value = ''
  }

  passwordError.value = password.value ? '' : 'Kata sandi wajib diisi.'

  if (emailError.value) {
    emailInput.value?.focus()
    return false
  }
  if (passwordError.value) {
    passwordInput.value?.focus()
    return false
  }
  return true
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Email atau kata sandi salah.'
    }
    if (error.status === 429) {
      return 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.'
    }
    if (error.status === 400) {
      return 'Periksa kembali data yang dimasukkan.'
    }
  }
  return 'Terjadi kesalahan, silakan coba lagi.'
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) {
    return
  }

  alert.value = null
  if (!validate()) {
    return
  }

  submitting.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    await router.push({ name: 'home' })
  } catch (error) {
    alert.value = { variant: 'danger', message: resolveErrorMessage(error) }
  } finally {
    password.value = ''
    showPassword.value = false
    submitting.value = false
  }
}
</script>

<template>
  <BlankLayout>
    <div class="auth-wrapper auth-cover">
      <div class="auth-inner row m-0">
        <a class="brand-logo" href="/">
          <img src="/vuexy/app-assets/images/logo/logo.svg" height="28" alt="" />
          <h2 class="brand-text text-primary ms-1">Canvas Wedding</h2>
        </a>

        <div class="d-none d-lg-flex col-lg-8 align-items-center p-5">
          <div class="w-100 d-lg-flex align-items-center justify-content-center px-5">
            <img class="img-fluid" src="/vuexy/app-assets/images/pages/login-v2.svg" alt="" />
          </div>
        </div>

        <div class="d-flex col-lg-4 align-items-center auth-bg px-2 p-lg-5">
          <div class="col-12 col-sm-8 col-md-6 col-lg-12 px-xl-2 mx-auto">
            <h1 class="card-title fw-bold mb-1">Masuk ke Canvas Wedding</h1>
            <p class="card-text mb-2">Gunakan akun yang terdaftar untuk mengakses panel admin.</p>

            <div
              v-if="alert"
              class="alert"
              :class="alert.variant === 'info' ? 'alert-info' : 'alert-danger'"
              role="alert"
            >
              <div class="alert-body">{{ alert.message }}</div>
            </div>

            <form
              class="auth-login-form mt-2"
              method="post"
              novalidate
              @submit.prevent="handleSubmit"
            >
              <div class="mb-1">
                <label class="form-label" for="login-email">Email</label>
                <input
                  id="login-email"
                  ref="emailInput"
                  v-model="email"
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': emailError }"
                  placeholder="superadmin@example.com"
                  autocomplete="username email"
                  autocapitalize="none"
                  spellcheck="false"
                  :aria-invalid="emailError ? 'true' : undefined"
                  :aria-describedby="emailError ? 'login-email-error' : undefined"
                  :disabled="submitting"
                />
                <div v-if="emailError" id="login-email-error" class="invalid-feedback d-block">
                  {{ emailError }}
                </div>
              </div>

              <div class="mb-1">
                <label class="form-label" for="login-password">Kata sandi</label>
                <div class="input-group input-group-merge form-password-toggle has-validation">
                  <input
                    id="login-password"
                    ref="passwordInput"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control form-control-merge"
                    :class="{ 'is-invalid': passwordError }"
                    placeholder="············"
                    autocomplete="current-password"
                    spellcheck="false"
                    :aria-invalid="passwordError ? 'true' : undefined"
                    :aria-describedby="passwordError ? 'login-password-error' : undefined"
                    :disabled="submitting"
                  />
                  <button
                    type="button"
                    class="input-group-text cursor-pointer"
                    :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                    :disabled="submitting"
                    @click="showPassword = !showPassword"
                  >
                    <FeatherIcon :name="showPassword ? 'eye-off' : 'eye'" />
                  </button>
                </div>
                <div
                  v-if="passwordError"
                  id="login-password-error"
                  class="invalid-feedback d-block"
                >
                  {{ passwordError }}
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-100" :disabled="submitting">
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm me-50"
                  aria-hidden="true"
                ></span>
                <span>{{ submitting ? 'Masuk…' : 'Masuk' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </BlankLayout>
</template>
