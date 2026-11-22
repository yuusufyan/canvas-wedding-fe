<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import { useAuthStore } from '@/stores/auth'

useDocumentTitle('Segera hadir')

const route = useRoute()
const authStore = useAuthStore()

// Nama halaman diambil dari menu backend yang path-nya cocok; selain itu judul generik.
const pageName = computed(() => {
  if (route.name === 'admin-template-editor') {
    return 'Editor Canvas'
  }
  return authStore.menus.find((menu) => menu.path === route.path)?.label ?? 'Halaman ini'
})
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <div class="nk-state nk-state--page">
        <span class="nk-modal__icon nk-modal__icon--brand"
          ><NkIcon name="sparkles" :size="22"
        /></span>
        <h1 class="nk-state__title">{{ pageName }} segera hadir</h1>
        <p>Fitur ini sedang kami siapkan. Sementara itu, kamu bisa melanjutkan ke menu lain.</p>
        <RouterLink class="nk-appbtn nk-appbtn--primary nk-appbtn--sm" :to="{ name: 'home' }">
          Kembali ke dasbor
        </RouterLink>
      </div>
    </div>
  </AppShellLayout>
</template>
