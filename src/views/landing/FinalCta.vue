<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
</script>

<template>
  <section class="nk-cta nk-dark" aria-labelledby="cta-title">
    <div class="nk-container">
      <h2 id="cta-title">Hari bahagia kalian pantas punya undangan yang personal.</h2>
      <p>Bikin undangan pertamamu gratis hari ini. Tanpa kartu kredit.</p>
      <RouterLink class="nk-btn nk-btn--gold" :to="{ name: 'register' }">
        Buat undangan gratis
        <NkIcon name="arrow-right" :size="18" />
      </RouterLink>
    </div>
  </section>
</template>
