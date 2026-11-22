<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import AuthLayout from '@/layouts/AuthLayout.vue'

useDocumentTitle('Halaman tidak ditemukan')
</script>

<template>
  <AuthLayout>
    <StatusPanel icon="alert-circle" tone="warning" title="Halaman tidak ditemukan">
      Alamat ini tidak ada atau sudah dipindahkan. Periksa kembali tautannya.
      <template #actions>
        <RouterLink class="nk-btn nk-btn--primary nk-btn--block" :to="{ name: 'landing' }">
          Kembali ke beranda
          <NkIcon name="arrow-right" :size="18" />
        </RouterLink>
      </template>
    </StatusPanel>
  </AuthLayout>
</template>
