<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

// Vuexy styles full-screen pages (login, error) through these body markers.
onMounted(() => {
  document.body.classList.add('blank-page')
  document.body.dataset.col = 'blank-page'
})

onBeforeUnmount(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
})
</script>

<template>
  <a class="skip-link visually-hidden-focusable btn btn-primary" href="#konten-utama"
    >Lompat ke konten utama</a
  >
  <main id="konten-utama" class="app-content content">
    <div class="content-overlay"></div>
    <div class="header-navbar-shadow"></div>
    <div class="content-wrapper">
      <div class="content-header row"></div>
      <div class="content-body">
        <slot />
      </div>
    </div>
  </main>
</template>
