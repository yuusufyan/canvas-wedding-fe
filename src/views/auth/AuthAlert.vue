<script setup lang="ts">
import NkIcon from '@/components/NkIcon.vue'
import type { NkIconName } from '@/constants/nk-icons'

type Tone = 'danger' | 'warning' | 'info' | 'success'

const props = defineProps<{ tone: Tone }>()

const ICONS: Record<Tone, NkIconName> = {
  danger: 'alert-circle',
  warning: 'mail',
  info: 'info',
  success: 'check-circle',
}
</script>

<template>
  <div
    class="nk-alert"
    :class="`nk-alert--${props.tone}`"
    :role="props.tone === 'danger' ? 'alert' : 'status'"
  >
    <NkIcon :name="ICONS[props.tone]" :size="18" />
    <div class="nk-alert__body">
      <slot />
    </div>
  </div>
</template>
