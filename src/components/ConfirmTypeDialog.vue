<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    /** Teks yang harus diketik persis agar tombol aktif. */
    expected: string
    confirmLabel: string
    /** Label kolom ketik; default untuk nama template. */
    inputLabel?: string
    busy?: boolean
    /** Aturan bisnis melarang aksi: tombol tetap nonaktif. */
    blocked?: boolean
    error?: string
  }>(),
  { busy: false, blocked: false, error: '', inputLabel: 'Ketik nama template untuk konfirmasi' },
)

const emit = defineEmits<{ close: []; confirm: [] }>()

const inputId = useId()
const typed = ref('')
const matches = computed(() => typed.value === props.expected)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      typed.value = ''
    }
  },
)

function submit(): void {
  if (matches.value && !props.blocked && !props.busy) {
    emit('confirm')
  }
}
</script>

<template>
  <AppDialog
    :open="open"
    :title="title"
    :description="description"
    :busy="busy"
    size="sm"
    @close="emit('close')"
  >
    <template #icon>
      <span class="nk-modal__icon nk-modal__icon--danger"
        ><NkIcon name="trash-2" :size="22"
      /></span>
    </template>

    <slot />

    <form class="nk-form" @submit.prevent="submit">
      <label class="nk-label" :for="inputId">{{ inputLabel }}</label>
      <input
        :id="inputId"
        v-model="typed"
        class="nk-input"
        type="text"
        autocomplete="off"
        :placeholder="expected"
        :disabled="busy || blocked"
        :aria-invalid="typed.length > 0 && !matches"
      />
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
        <button
          type="submit"
          class="nk-appbtn nk-appbtn--danger"
          :disabled="!matches || blocked || busy"
        >
          {{ busy ? 'Menghapus…' : confirmLabel }}
          <NkIcon name="trash-2" :size="16" />
        </button>
      </div>
    </form>
  </AppDialog>
</template>
