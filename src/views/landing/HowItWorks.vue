<script setup lang="ts">
import { LANDING_STEPS } from '@/constants/landing'
</script>

<template>
  <section id="cara-kerja" class="nk-section" aria-labelledby="cara-kerja-title">
    <div class="nk-container">
      <p class="nk-eyebrow">Cara kerja</p>
      <h2 id="cara-kerja-title" class="nk-h2">
        Dari halaman kosong ke undangan jadi, hanya tiga langkah.
      </h2>
      <ol class="nk-steps">
        <li v-for="step in LANDING_STEPS" :key="step.num" class="nk-step">
          <div class="nk-step__num" aria-hidden="true">{{ step.num }}</div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
