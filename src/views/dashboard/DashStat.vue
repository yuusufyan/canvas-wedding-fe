<script setup lang="ts">
import NkIcon from '@/components/NkIcon.vue'
import type { NkIconName } from '@/constants/nk-icons'
import type { AsyncStatus } from '@/composables/useAsyncState'

defineProps<{
  label: string
  icon: NkIconName
  status: AsyncStatus
  value: string
  note: string
  tone?: 'success' | 'warning' | 'muted'
}>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="nk-stat nk-dashstat" :aria-busy="status === 'loading'">
    <div class="nk-dashstat__top">
      <p class="nk-stat__label">{{ label }}</p>
      <span class="nk-dashstat__icon" aria-hidden="true"><NkIcon :name="icon" :size="16" /></span>
    </div>
    <div v-if="status === 'loading' || status === 'idle'" class="nk-skeleton nk-dashstat__skeleton">
      <span class="nk-visually-hidden" role="status">Memuat {{ label }}…</span>
    </div>
    <template v-else-if="status === 'ready'">
      <p class="nk-stat__value">{{ value }}</p>
      <p class="nk-dashstat__note" :class="tone && `is-${tone}`">{{ note }}</p>
    </template>
    <div v-else role="alert">
      <p class="nk-stat__note">
        {{ status === 'forbidden' ? 'Tidak ada akses.' : 'Belum bisa dimuat.' }}
      </p>
      <button v-if="status !== 'forbidden'" type="button" class="nk-linkbtn" @click="emit('retry')">
        Coba lagi
      </button>
    </div>
  </div>
</template>
