<script setup lang="ts">
import NkIcon from '@/components/NkIcon.vue'
import type { TemplateAccess } from '@/types/invitation-document'

// overlay: di atas thumbnail (Gratis putih); inline: di tabel (Gratis abu).
withDefaults(defineProps<{ access: TemplateAccess; variant?: 'overlay' | 'inline' }>(), {
  variant: 'overlay',
})
</script>

<template>
  <span
    class="nk-tag"
    :class="
      access === 'Premium'
        ? 'nk-tag--premium'
        : variant === 'overlay'
          ? 'nk-tag--free'
          : 'nk-tag--plain'
    "
  >
    <NkIcon v-if="access === 'Premium'" name="crown" :size="12" />
    {{ access }}
  </span>
</template>
