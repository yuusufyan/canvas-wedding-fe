<script setup lang="ts">
import NkIcon from '@/components/NkIcon.vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="nk-toasts" role="status" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="nk-toast"
      :class="`nk-toast--${toast.tone}`"
    >
      <NkIcon :name="toast.tone === 'success' ? 'check-circle' : 'alert-triangle'" :size="18" />
      <span>{{ toast.message }}</span>
      <button
        type="button"
        class="nk-toast__close"
        aria-label="Tutup pemberitahuan"
        @click="dismiss(toast.id)"
      >
        <NkIcon name="x" :size="16" />
      </button>
    </div>
  </div>
</template>
