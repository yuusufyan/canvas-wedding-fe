<script setup lang="ts">
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import type { User } from '@/types/user'

const props = defineProps<{
  open: boolean
  user: User | null
  isSelf: boolean
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppDialog
    :open="props.open"
    :title="`Nonaktifkan ${props.user?.name ?? ''}?`"
    description="Pengguna tidak bisa masuk lagi dan semua sesi login-nya diputus. Kamu bisa mengaktifkannya kembali kapan saja."
    :busy="props.busy"
    size="sm"
    @close="emit('close')"
  >
    <template #icon>
      <span class="nk-modal__icon nk-modal__icon--warning"><NkIcon name="lock" :size="22" /></span>
    </template>

    <p v-if="props.isSelf" class="nk-note nk-note--warning">
      <NkIcon name="lock" :size="16" />Akunmu sendiri tidak bisa dinonaktifkan.
    </p>
    <p v-else class="nk-note">
      <NkIcon name="info" :size="16" />SuperAdmin aktif terakhir tidak bisa dinonaktifkan.
    </p>
    <p v-if="props.error" class="nk-form__error" role="alert">{{ props.error }}</p>

    <div class="nk-modal__actions">
      <button
        type="button"
        class="nk-appbtn nk-appbtn--outline"
        :disabled="props.busy"
        @click="emit('close')"
      >
        Batal
      </button>
      <button
        type="button"
        class="nk-appbtn nk-appbtn--warning"
        :disabled="props.busy || props.isSelf"
        @click="emit('confirm')"
      >
        {{ props.busy ? 'Menonaktifkan…' : 'Nonaktifkan' }}
      </button>
    </div>
  </AppDialog>
</template>
