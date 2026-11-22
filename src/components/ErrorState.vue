<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message?: string
  }>(),
  {
    title: 'Data belum bisa dimuat',
    message: 'Terjadi kendala saat memuat data. Periksa koneksi lalu coba lagi.',
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="nk-state" role="alert">
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <button type="button" class="nk-btn nk-btn--outline nk-btn--sm" @click="$emit('retry')">
      Coba lagi
    </button>
  </div>
</template>
