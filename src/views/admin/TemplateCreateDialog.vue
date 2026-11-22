<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { createTemplate } from '@/api/templates'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import { TEMPLATE_ACCESSES, TEMPLATE_NAME_MAX } from '@/constants/admin'
import type { AdminTemplate } from '@/types/admin'
import type { TemplateAccess } from '@/types/invitation-document'
import { describeError } from '@/utils/api-error'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; created: [template: AdminTemplate] }>()

const uid = useId()
const name = ref('')
const access = ref<TemplateAccess>('Gratis')
const busy = ref(false)
const error = ref('')

const trimmed = computed(() => name.value.trim())
const canSubmit = computed(() => trimmed.value.length > 0 && !busy.value)

const ACCESS_NOTE: Record<TemplateAccess, string> = {
  Gratis: 'Semua pengguna',
  Premium: 'Khusus member Premium',
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = ''
      access.value = 'Gratis'
      error.value = ''
    }
  },
)

async function submit(): Promise<void> {
  if (!canSubmit.value) {
    return
  }
  busy.value = true
  error.value = ''
  try {
    const created = await createTemplate({ name: trimmed.value, access: access.value })
    emit('created', created)
  } catch (err) {
    error.value = describeError(err, 'Nama template sudah dipakai. Gunakan nama lain.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppDialog
    :open="props.open"
    title="Template baru"
    description="Buat desain baru, lalu lanjut menyusunnya di Canvas."
    :busy="busy"
    @close="emit('close')"
  >
    <form class="nk-form" novalidate @submit.prevent="submit">
      <div class="nk-field">
        <div class="nk-field__row">
          <label class="nk-label" :for="`${uid}-name`">Nama template</label>
          <span class="nk-field__count">{{ name.length }}/{{ TEMPLATE_NAME_MAX }}</span>
        </div>
        <input
          :id="`${uid}-name`"
          v-model="name"
          class="nk-input"
          type="text"
          required
          autocomplete="off"
          :maxlength="TEMPLATE_NAME_MAX"
          :disabled="busy"
        />
      </div>

      <fieldset class="nk-field">
        <legend class="nk-label">Mulai dari</legend>
        <div class="nk-choices nk-choices--three">
          <label class="nk-choice is-selected">
            <input type="radio" name="source" value="blank" checked class="nk-visually-hidden" />
            <NkIcon name="file" :size="20" />
            <strong>Kosong</strong>
            <small>Halaman kosong</small>
          </label>
          <label class="nk-choice is-disabled" title="Segera hadir">
            <input
              type="radio"
              name="source"
              value="duplicate"
              disabled
              class="nk-visually-hidden"
            />
            <NkIcon name="copy" :size="20" />
            <strong>Duplikat</strong>
            <small>Segera hadir</small>
          </label>
          <label class="nk-choice is-disabled" title="Segera hadir">
            <input type="radio" name="source" value="import" disabled class="nk-visually-hidden" />
            <NkIcon name="upload" :size="20" />
            <strong>Impor</strong>
            <small>Segera hadir</small>
          </label>
        </div>
      </fieldset>

      <fieldset class="nk-field">
        <legend class="nk-label">Ukuran halaman</legend>
        <div class="nk-segmented">
          <span class="nk-segmented__item is-selected">Mobile &middot; 390 &times; 844</span>
          <span class="nk-segmented__item is-disabled" title="Segera hadir">Kustom</span>
        </div>
      </fieldset>

      <fieldset class="nk-field">
        <legend class="nk-label">Akses template</legend>
        <div class="nk-choices nk-choices--two">
          <label
            v-for="option in TEMPLATE_ACCESSES"
            :key="option"
            class="nk-choice nk-choice--row"
            :class="{ 'is-selected': access === option }"
          >
            <input
              v-model="access"
              type="radio"
              name="access"
              :value="option"
              class="nk-visually-hidden"
              :disabled="busy"
            />
            <NkIcon :name="option === 'Premium' ? 'crown' : 'globe'" :size="20" />
            <span>
              <strong>{{ option }}</strong>
              <small>{{ ACCESS_NOTE[option] }}</small>
            </span>
            <span class="nk-radio" aria-hidden="true"></span>
          </label>
        </div>
      </fieldset>

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
          {{ busy ? 'Membuat…' : 'Buat template' }}
          <NkIcon name="arrow-right" :size="16" />
        </button>
      </div>
    </form>
  </AppDialog>
</template>
