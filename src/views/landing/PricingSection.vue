<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import { LANDING_PLANS } from '@/constants/landing'

const { free, premium } = LANDING_PLANS
</script>

<template>
  <section id="harga" class="nk-section nk-pricing" aria-labelledby="harga-title">
    <div class="nk-container nk-pricing__grid">
      <div>
        <p class="nk-eyebrow">Harga</p>
        <h2 id="harga-title" class="nk-h2">Mulai gratis, upgrade saat kalian siap.</h2>
        <p class="nk-pricing__lead">
          Tidak ada biaya tersembunyi. Batalkan kapan saja, undangan yang sudah dibuat tetap aman.
        </p>
      </div>

      <div class="nk-plans">
        <article class="nk-plan" aria-labelledby="plan-free">
          <div class="nk-plan__head">
            <h3 id="plan-free">{{ free.name }}</h3>
          </div>
          <p class="nk-plan__price">{{ free.price }}</p>
          <p class="nk-plan__desc">{{ free.description }}</p>
          <ul class="nk-plan__list">
            <li v-for="item in free.features" :key="item">
              <NkIcon name="check" :size="18" />{{ item }}
            </li>
          </ul>
          <RouterLink class="nk-btn nk-btn--outline" :to="{ name: 'register' }">
            Mulai gratis
          </RouterLink>
        </article>

        <article class="nk-plan nk-plan--premium nk-dark" aria-labelledby="plan-premium">
          <div class="nk-plan__head">
            <h3 id="plan-premium">{{ premium.name }}</h3>
            <span class="nk-tag nk-tag--gold">
              <NkIcon name="crown" :size="12" />Paling populer
            </span>
          </div>
          <p class="nk-plan__price">
            {{ premium.price }}<small>{{ premium.unit }}</small>
          </p>
          <p class="nk-plan__desc">{{ premium.description }}</p>
          <ul class="nk-plan__list">
            <li v-for="item in premium.features" :key="item">
              <NkIcon name="check" :size="18" />{{ item }}
            </li>
          </ul>
          <RouterLink class="nk-btn nk-btn--gold" :to="{ name: 'register' }"
            >Coba Premium</RouterLink
          >
        </article>
      </div>
    </div>
  </section>
</template>
