<script setup lang="ts">
import AccordionList from '@/components/AccordionList.vue'
import { LANDING_FAQ } from '@/constants/landing'
</script>

<template>
  <section id="faq" class="nk-section" aria-labelledby="faq-title">
    <div class="nk-container nk-faq__grid">
      <div>
        <p class="nk-eyebrow">FAQ</p>
        <h2 id="faq-title" class="nk-h2">Pertanyaan yang sering muncul.</h2>
      </div>
      <AccordionList :items="LANDING_FAQ" default-open-id="gratis" />
    </div>
  </section>
</template>
