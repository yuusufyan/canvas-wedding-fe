<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { createUser, updateUser } from '@/api/users'
import { ApiError } from '@/api/http'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import { ROLES } from '@/constants/roles'
import type { Role } from '@/types/role'
import type { UpdateUserRequest, User } from '@/types/user'
import { describeError } from '@/utils/api-error'
import { validateEmail, validateName, validateNewPassword } from '@/utils/validation'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  user: User | null
  roles: Role[]
  /** Akun sendiri: role dan status dikunci. */
  isSelf: boolean
}>()
const emit = defineEmits<{ close: []; saved: [user: User, mode: 'create' | 'edit'] }>()

const uid = useId()
const name = ref('')
const email = ref('')
const password = ref('')
const roleId = ref('')
const isActive = ref(true)
const changePassword = ref(false)
const busy = ref(false)
const error = ref('')
const nameError = ref('')
const emailError = ref('')
const passwordError = ref('')

const isEdit = computed(() => props.mode === 'edit')
const lockedMessage =
  'Role dan status SuperAdmin aktif terakhir serta akunmu sendiri tidak bisa diubah.'

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    name.value = props.user?.name ?? ''
    email.value = props.user?.email ?? ''
    password.value = ''
    changePassword.value = false
    isActive.value = props.user?.is_active ?? true
    roleId.value = props.user?.role.id ?? props.roles.find((r) => r.name === ROLES.USER)?.id ?? ''
    error.value = ''
    nameError.value = ''
    emailError.value = ''
    passwordError.value = ''
  },
)

// Hanya field yang berubah yang dikirim (PATCH).
const patch = computed<UpdateUserRequest>(() => {
  const u = props.user
  if (!u) {
    return {}
  }
  const body: UpdateUserRequest = {}
  if (name.value.trim() !== u.name) {
    body.name = name.value.trim()
  }
  if (email.value.trim().toLowerCase() !== u.email) {
    body.email = email.value.trim()
  }
  if (!props.isSelf && roleId.value !== u.role.id) {
    body.role_id = roleId.value
  }
  if (!props.isSelf && isActive.value !== u.is_active) {
    body.is_active = isActive.value
  }
  if (changePassword.value && password.value) {
    body.password = password.value
  }
  return body
})

const canSubmit = computed(() => {
  if (busy.value || !roleId.value) {
    return false
  }
  return isEdit.value ? Object.keys(patch.value).length > 0 : true
})

function validate(): boolean {
  nameError.value = validateName(name.value)
  emailError.value = validateEmail(email.value)
  passwordError.value =
    !isEdit.value || changePassword.value ? validateNewPassword(password.value) : ''
  return !nameError.value && !emailError.value && !passwordError.value
}

// 409 backend: email sudah dipakai, atau perlindungan akun sendiri / SuperAdmin aktif terakhir.
function conflictMessage(): string {
  const body = patch.value
  const touchesProtected = 'role_id' in body || 'is_active' in body
  const touchesEmail = 'email' in body
  if (!isEdit.value || (touchesEmail && !touchesProtected)) {
    return 'Email sudah terdaftar. Gunakan email lain.'
  }
  if (touchesProtected && !touchesEmail) {
    return 'Perubahan ditolak: akunmu sendiri atau SuperAdmin aktif terakhir tidak boleh dinonaktifkan atau diturunkan rolenya.'
  }
  return 'Perubahan ditolak: email sudah terdaftar, atau akun dilindungi (akunmu sendiri / SuperAdmin aktif terakhir).'
}

async function submit(): Promise<void> {
  if (!canSubmit.value || !validate()) {
    return
  }
  busy.value = true
  error.value = ''
  const conflict = conflictMessage()
  try {
    const saved = isEdit.value
      ? await updateUser(props.user!.id, patch.value)
      : await createUser({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
          role_id: roleId.value,
        })
    emit('saved', saved, props.mode)
  } catch (err) {
    error.value =
      err instanceof ApiError && err.status === 400
        ? 'Periksa kembali data yang dimasukkan.'
        : describeError(err, conflict)
  } finally {
    password.value = ''
    busy.value = false
  }
}
</script>

<template>
  <AppDialog
    :open="props.open"
    :title="isEdit ? 'Ubah pengguna' : 'Tambah pengguna'"
    :description="
      isEdit
        ? props.isSelf
          ? `${props.user?.name ?? ''} · akunmu sendiri`
          : (props.user?.name ?? '')
        : 'Akun baru langsung bisa dipakai untuk masuk.'
    "
    :busy="busy"
    @close="emit('close')"
  >
    <form class="nk-form" novalidate @submit.prevent="submit">
      <div class="nk-field">
        <label class="nk-label" :for="`${uid}-name`">Nama lengkap</label>
        <input
          :id="`${uid}-name`"
          v-model="name"
          class="nk-input"
          type="text"
          autocomplete="off"
          maxlength="100"
          :disabled="busy"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? `${uid}-name-error` : undefined"
        />
        <p v-if="nameError" :id="`${uid}-name-error`" class="nk-form__error">{{ nameError }}</p>
      </div>

      <div class="nk-field">
        <label class="nk-label" :for="`${uid}-email`">Email</label>
        <input
          :id="`${uid}-email`"
          v-model="email"
          class="nk-input"
          type="email"
          autocomplete="off"
          spellcheck="false"
          :disabled="busy"
          :aria-invalid="emailError ? 'true' : undefined"
          :aria-describedby="emailError ? `${uid}-email-error` : undefined"
        />
        <p v-if="emailError" :id="`${uid}-email-error`" class="nk-form__error">{{ emailError }}</p>
      </div>

      <div v-if="!isEdit || changePassword" class="nk-field">
        <label class="nk-label" :for="`${uid}-password`">
          {{ isEdit ? 'Kata sandi baru' : 'Kata sandi' }}
        </label>
        <input
          :id="`${uid}-password`"
          v-model="password"
          class="nk-input"
          type="password"
          autocomplete="new-password"
          spellcheck="false"
          :disabled="busy"
          :aria-invalid="passwordError ? 'true' : undefined"
          :aria-describedby="`${uid}-password-hint`"
        />
        <p :id="`${uid}-password-hint`" class="nk-field__hint">
          8–72 karakter. Bagikan lewat saluran yang aman.
        </p>
        <p v-if="passwordError" class="nk-form__error">{{ passwordError }}</p>
      </div>
      <button
        v-else
        type="button"
        class="nk-linkbtn nk-linkbtn--start"
        :disabled="busy"
        @click="changePassword = true"
      >
        Ubah kata sandi
      </button>

      <div class="nk-field">
        <label class="nk-label" :for="`${uid}-role`">Role</label>
        <div class="nk-selectwrap">
          <select
            :id="`${uid}-role`"
            v-model="roleId"
            class="nk-select nk-select--full"
            :disabled="busy || (isEdit && props.isSelf)"
            :aria-describedby="isEdit && props.isSelf ? `${uid}-locked` : undefined"
          >
            <option v-if="props.roles.length === 0" value="" disabled>
              Role belum bisa dimuat
            </option>
            <option v-for="role in props.roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
          <NkIcon v-if="isEdit && props.isSelf" name="lock" :size="16" />
        </div>
        <p v-if="isEdit && props.isSelf" :id="`${uid}-locked`" class="nk-field__hint">
          {{ lockedMessage }}
        </p>
        <p v-else-if="isEdit && props.user?.role.name === ROLES.SUPERADMIN" class="nk-field__hint">
          Jika ini SuperAdmin aktif terakhir, perubahan role atau status akan ditolak.
        </p>
      </div>

      <div v-if="isEdit" class="nk-toggle-row" :class="{ 'is-locked': props.isSelf }">
        <div>
          <p class="nk-toggle-row__title" :id="`${uid}-active-label`">Akun aktif</p>
          <p class="nk-toggle-row__hint">
            {{
              props.isSelf
                ? 'Tidak bisa dinonaktifkan.'
                : isActive
                  ? 'Pengguna bisa masuk.'
                  : 'Pengguna tidak bisa masuk dan semua sesinya diputus.'
            }}
          </p>
        </div>
        <button
          type="button"
          class="nk-toggle"
          role="switch"
          :aria-checked="isActive"
          :aria-labelledby="`${uid}-active-label`"
          :disabled="busy || props.isSelf"
          @click="isActive = !isActive"
        ></button>
      </div>

      <p v-if="!isEdit" class="nk-note">
        <NkIcon name="info" :size="16" />Akun buatan SuperAdmin langsung aktif tanpa email aktivasi.
      </p>
      <p v-if="error" class="nk-form__error" role="alert">{{ error }}</p>

      <div class="nk-modal__actions">
        <button
          type="button"
          class="nk-appbtn nk-appbtn--outline"
          :disabled="busy"
          @click="emit('close')"
        >
          Batal
        </button>
        <button type="submit" class="nk-appbtn nk-appbtn--primary" :disabled="!canSubmit">
          {{ busy ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah pengguna' }}
          <NkIcon v-if="!busy" :name="isEdit ? 'check' : 'user-plus'" :size="16" />
        </button>
      </div>
    </form>
  </AppDialog>
</template>
