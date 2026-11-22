<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { ApiError } from '@/api/http'
import { createRole, updateRole } from '@/api/roles'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import type { Role, UpdateRoleRequest } from '@/types/role'
import { describeError } from '@/utils/api-error'

const props = defineProps<{ open: boolean; mode: 'create' | 'edit'; role: Role | null }>()
const emit = defineEmits<{ close: []; saved: [role: Role, mode: 'create' | 'edit'] }>()

const NAME_MIN = 3
const NAME_MAX = 50
const DESCRIPTION_MAX = 255
// Sama dengan validator backend (role_name): huruf, angka, spasi, garis bawah, dan strip.
const NAME_PATTERN = /^[A-Za-z0-9 _-]+$/

const uid = useId()
const name = ref('')
const description = ref('')
const busy = ref(false)
const error = ref('')
const nameError = ref('')

const isEdit = computed(() => props.mode === 'edit')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = props.role?.name ?? ''
      description.value = props.role?.description ?? ''
      error.value = ''
      nameError.value = ''
    }
  },
)

const patch = computed<UpdateRoleRequest>(() => {
  const body: UpdateRoleRequest = {}
  if (name.value.trim() !== props.role?.name) {
    body.name = name.value.trim()
  }
  if (description.value.trim() !== (props.role?.description ?? '')) {
    body.description = description.value.trim()
  }
  return body
})

const canSubmit = computed(() => {
  if (busy.value || !name.value.trim()) {
    return false
  }
  return isEdit.value ? Object.keys(patch.value).length > 0 : true
})

function validate(): boolean {
  const trimmed = name.value.trim()
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    nameError.value = `Nama role ${NAME_MIN}–${NAME_MAX} karakter.`
  } else if (!NAME_PATTERN.test(trimmed)) {
    nameError.value = 'Nama role hanya boleh huruf, angka, spasi, garis bawah, dan strip.'
  } else {
    nameError.value = ''
  }
  return !nameError.value
}

async function submit(): Promise<void> {
  if (!canSubmit.value || !validate()) {
    return
  }
  busy.value = true
  error.value = ''
  try {
    const saved = isEdit.value
      ? await updateRole(props.role!.id, patch.value)
      : await createRole({
          name: name.value.trim(),
          ...(description.value.trim() ? { description: description.value.trim() } : {}),
        })
    emit('saved', saved, props.mode)
  } catch (err) {
    error.value =
      err instanceof ApiError && err.status === 400
        ? 'Periksa kembali data yang dimasukkan.'
        : describeError(err, 'Nama role sudah dipakai. Gunakan nama lain.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppDialog
    :open="props.open"
    :title="isEdit ? 'Ubah role' : 'Tambah role'"
    :description="
      isEdit
        ? 'Ubah nama atau deskripsi role. Izin dan menu diatur terpisah.'
        : 'Setelah dibuat, kamu akan diarahkan untuk mengatur izin dan menunya.'
    "
    :busy="busy"
    size="sm"
    @close="emit('close')"
  >
    <form class="nk-form" novalidate @submit.prevent="submit">
      <div class="nk-field">
        <div class="nk-field__row">
          <label class="nk-label" :for="`${uid}-name`">Nama role</label>
          <span class="nk-field__count">{{ name.length }}/{{ NAME_MAX }}</span>
        </div>
        <input
          :id="`${uid}-name`"
          v-model="name"
          class="nk-input"
          type="text"
          autocomplete="off"
          :maxlength="NAME_MAX"
          :disabled="busy"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? `${uid}-name-error` : undefined"
        />
        <p v-if="nameError" :id="`${uid}-name-error`" class="nk-form__error">{{ nameError }}</p>
      </div>
      <div class="nk-field">
        <label class="nk-label" :for="`${uid}-description`">Deskripsi (opsional)</label>
        <textarea
          :id="`${uid}-description`"
          v-model="description"
          class="nk-input nk-textarea"
          rows="3"
          :maxlength="DESCRIPTION_MAX"
          :disabled="busy"
        ></textarea>
      </div>
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
          {{ busy ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Buat role' }}
          <NkIcon v-if="!busy" :name="isEdit ? 'check' : 'arrow-right'" :size="16" />
        </button>
      </div>
    </form>
  </AppDialog>
</template>
