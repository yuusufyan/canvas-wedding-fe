<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'

useDocumentTitle('Akses ditolak')
</script>

<template>
  <AuthLayout>
    <StatusPanel icon="lock" tone="warning" title="Kamu tidak punya akses">
      Halaman ini hanya untuk administrator. Hubungi administrator bila kamu merasa seharusnya bisa
      membukanya.
      <template #actions>
        <RouterLink class="nk-btn nk-btn--primary nk-btn--block" :to="{ name: 'landing' }">
          Kembali ke beranda
          <NkIcon name="arrow-right" :size="18" />
        </RouterLink>
      </template>
    </StatusPanel>
  </AuthLayout>
</template>
