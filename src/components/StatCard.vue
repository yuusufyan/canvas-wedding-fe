<script setup lang="ts">
import type { StatusTone } from '@/constants/admin'

defineProps<{ label: string; value: string; note: string; tone: StatusTone }>()
</script>

<template>
  <div class="nk-stat">
    <p class="nk-stat__label">
      <span class="nk-stat__dot" :class="`nk-stat__dot--${tone}`"></span>{{ label }}
    </p>
    <p class="nk-stat__value">{{ value }}</p>
    <p class="nk-stat__note">{{ note }}</p>
  </div>
</template>
