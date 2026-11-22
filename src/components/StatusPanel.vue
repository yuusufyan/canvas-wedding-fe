<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NkIcon from '@/components/NkIcon.vue'
import type { NkIconName } from '@/constants/nk-icons'

withDefaults(
  defineProps<{
    icon: NkIconName
    title: string
    tone?: 'brand' | 'warning' | 'success'
  }>(),
  { tone: 'brand' },
)

const heading = ref<HTMLElement | null>(null)

// Halaman status menggantikan seluruh tampilan: fokus ke judul agar pembaca layar mengumumkannya.
onMounted(() => heading.value?.focus())
</script>

<template>
  <div class="nk-auth__center">
    <span class="nk-auth__icon" :class="`nk-auth__icon--${tone}`"
      ><NkIcon :name="icon" :size="32"
    /></span>
    <h1 ref="heading" class="nk-auth__title" tabindex="-1">{{ title }}</h1>
    <p class="nk-auth__lead"><slot /></p>
    <slot name="actions" />
  </div>
</template>
