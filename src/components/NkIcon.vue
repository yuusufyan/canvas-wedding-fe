<script setup lang="ts">
import { NK_ICONS, type NkIconName } from '@/constants/nk-icons'

withDefaults(
  defineProps<{
    name: NkIconName
    size?: number
    /** Nama aksesibel; kosongkan untuk ikon yang berdampingan dengan teks. */
    label?: string
  }>(),
  { size: 20, label: undefined },
)
</script>

<template>
  <svg
    class="nk-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path v-for="d in NK_ICONS[name]" :key="d" :d="d" />
  </svg>
</template>
