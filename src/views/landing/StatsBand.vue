<script setup lang="ts">
import { LANDING_STATS } from '@/constants/landing'
</script>

<template>
  <section class="nk-stats" aria-label="Angka pemakaian">
    <div class="nk-container">
      <ul class="nk-stats__grid">
        <li v-for="stat in LANDING_STATS" :key="stat.label">
          <p class="nk-stats__value">{{ stat.value }}</p>
          <p class="nk-stats__label">{{ stat.label }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>
