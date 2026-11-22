<script setup lang="ts">
import { computed } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import type { AdminTemplate } from '@/types/admin'
import { formatNumber } from '@/utils/relative-time'

const props = defineProps<{
  open: boolean
  template: AdminTemplate | null
  busy: boolean
  error: string
}>()

const emit = defineEmits<{ close: []; confirm: [] }>()

const usage = computed(() =>
  props.template && props.template.in_use_count > 0
    ? `Dipakai oleh ${formatNumber(props.template.in_use_count)} undangan aktif`
    : 'Tidak dipakai undangan mana pun',
)
</script>

<template>
  <AppDialog
    :open="props.open"
    :title="`Arsipkan “${props.template?.name ?? ''}”?`"
    description="Template tidak akan muncul di katalog pelanggan baru. Undangan yang sudah memakainya tetap berjalan normal. Kamu bisa memulihkannya kapan saja dari filter Arsip."
    :busy="props.busy"
    size="sm"
    @close="emit('close')"
  >
    <template #icon>
      <span class="nk-modal__icon nk-modal__icon--warning"
        ><NkIcon name="archive" :size="22"
      /></span>
    </template>

    <p class="nk-note"><NkIcon name="info" :size="16" />{{ usage }}</p>
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
        :disabled="props.busy"
        @click="emit('confirm')"
      >
        {{ props.busy ? 'Mengarsipkan…' : 'Arsipkan' }}
        <NkIcon name="archive" :size="16" />
      </button>
    </div>
  </AppDialog>
</template>
