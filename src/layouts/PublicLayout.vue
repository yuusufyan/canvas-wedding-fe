<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import { LANDING_FOOTER_LINKS, LANDING_NAV } from '@/constants/landing'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const menuOpen = ref(false)

function closeMenu(): void {
  menuOpen.value = false
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

// Halaman publik tidak memakai penanda halaman kosong Vuexy milik layar login.
onMounted(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
})
</script>

<template>
  <div class="nk-public" @keydown="handleKeydown">
    <a class="nk-skip" href="#konten-utama">Lompat ke konten utama</a>

    <header class="nk-header">
      <div class="nk-container nk-header__bar">
        <RouterLink class="nk-logo" :to="{ name: 'landing' }" aria-label="Niskala Daisy, beranda">
          <img src="/brand/niskala-daisy-logo.png" alt="" width="1080" height="1080" />
        </RouterLink>

        <nav class="nk-nav" aria-label="Navigasi utama">
          <button
            type="button"
            class="nk-nav__toggle"
            :aria-expanded="menuOpen"
            aria-controls="nk-nav-panel"
            :aria-label="menuOpen ? 'Tutup menu' : 'Buka menu'"
            @click="menuOpen = !menuOpen"
          >
            <NkIcon :name="menuOpen ? 'x' : 'menu'" :size="24" />
          </button>
          <div id="nk-nav-panel" class="nk-nav__panel" :class="{ 'is-open': menuOpen }">
            <ul class="nk-nav__links">
              <li
                v-for="item in LANDING_NAV"
                :key="item.id"
                :class="{ 'nk-only-wide': item.wideOnly }"
              >
                <RouterLink :to="{ name: 'landing', hash: `#${item.id}` }" @click="closeMenu">
                  {{ item.label }}
                </RouterLink>
              </li>
            </ul>
            <div class="nk-nav__actions">
              <template v-if="authStore.isAuthenticated">
                <RouterLink
                  class="nk-btn nk-btn--primary nk-btn--sm"
                  :to="authStore.isSuperAdmin ? { name: 'home' } : '/app'"
                >
                  Dashboard
                </RouterLink>
              </template>
              <template v-else>
                <RouterLink class="nk-nav__login nk-only-wide" :to="{ name: 'login' }">
                  Masuk
                </RouterLink>
                <RouterLink class="nk-btn nk-btn--primary nk-btn--sm" :to="{ name: 'register' }">
                  Mulai gratis
                </RouterLink>
              </template>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <main id="konten-utama" tabindex="-1">
      <slot />
    </main>

    <footer class="nk-footer">
      <div class="nk-container nk-footer__inner">
        <RouterLink class="nk-logo" :to="{ name: 'landing' }" aria-label="Niskala Daisy, beranda">
          <img src="/brand/niskala-daisy-logo-white.png" alt="" width="1080" height="1080" />
        </RouterLink>
        <nav aria-label="Tautan situs">
          <ul class="nk-footer__links">
            <li v-for="item in LANDING_FOOTER_LINKS" :key="item.id">
              <RouterLink :to="{ name: 'landing', hash: `#${item.id}` }">{{
                item.label
              }}</RouterLink>
            </li>
          </ul>
        </nav>
        <small>&copy; 2026 Niskala Daisy</small>
      </div>
    </footer>
  </div>
</template>
