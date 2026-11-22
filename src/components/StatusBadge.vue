<script setup lang="ts">
import type { StatusTone } from '@/constants/admin'

defineProps<{ tone: StatusTone; label: string }>()
</script>

<template>
  <span class="nk-status" :class="`nk-status--${tone}`">{{ label }}</span>
</template>
