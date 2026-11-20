<script setup lang="ts">
import { RouterLink } from 'vue-router'
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import NkIcon from '@/components/NkIcon.vue'
import { DEMO_SLUG_DEFAULT, HERO_PREVIEW_PAGE } from '@/constants/landing'
</script>

<template>
  <section class="nk-hero" aria-labelledby="hero-title">
    <div class="nk-container nk-hero__grid">
      <div>
        <p class="nk-badge-pill">
          <NkIcon name="sparkles" :size="16" />
          Undangan digital dengan editor drag-and-drop
        </p>
        <h1 id="hero-title">Undangan yang terasa seperti kalian berdua.</h1>
        <p class="nk-hero__lead">
          Pilih template, ubah teks, foto, dan warna sesukamu seperti di Canva, lalu bagikan lewat
          satu link. Tanpa desainer, tanpa ribet, selesai dalam hitungan menit.
        </p>
        <div class="nk-hero__cta">
          <RouterLink class="nk-btn nk-btn--primary" :to="{ name: 'login' }">
            Buat undangan gratis
            <NkIcon name="arrow-right" :size="18" />
          </RouterLink>
          <RouterLink
            class="nk-btn nk-btn--outline"
            :to="{ name: 'demo', params: { slug: DEMO_SLUG_DEFAULT } }"
          >
            <NkIcon name="play" :size="16" />
            Lihat demo
          </RouterLink>
        </div>
        <p class="nk-proof">
          <span class="nk-proof__dots" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </span>
          Dipakai 2.400+ pasangan &middot; Tanpa kartu kredit
        </p>
      </div>

      <div class="nk-hero__visual" aria-hidden="true">
        <div class="nk-hero__arch"></div>
        <div class="nk-hero__phone">
          <div class="nk-phone">
            <InvitationRenderer :page="HERO_PREVIEW_PAGE" decorative />
          </div>
        </div>
        <div class="nk-hero__toast">
          <span class="nk-hero__check"><NkIcon name="check" :size="14" /></span>
          <span>
            <strong>RSVP baru masuk</strong>
            Nadia akan hadir &middot; 2 tamu
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
