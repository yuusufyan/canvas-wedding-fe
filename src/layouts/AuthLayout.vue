<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import { AUTH_PREVIEW_PAGE } from '@/constants/auth'

// Halaman auth tidak memakai penanda halaman kosong Vuexy milik layar login lama.
onMounted(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
})
</script>

<template>
  <div class="nk-auth">
    <a class="nk-skip" href="#konten-utama">Lompat ke konten utama</a>

    <aside class="nk-auth__brand">
      <RouterLink
        class="nk-logo nk-auth__brandlogo"
        :to="{ name: 'landing' }"
        aria-label="Niskala Daisy, beranda"
      >
        <img src="/brand/niskala-daisy-logo-white.png" alt="" width="1080" height="1080" />
      </RouterLink>
      <div class="nk-auth__pitch">
        <p class="nk-auth__headline">Undangan yang terasa seperti kalian berdua.</p>
        <p class="nk-auth__sub">Susun, bagikan, dan pantau RSVP dalam satu tempat.</p>
      </div>
      <div class="nk-auth__phone" aria-hidden="true">
        <div class="nk-phone">
          <InvitationRenderer :page="AUTH_PREVIEW_PAGE" decorative />
        </div>
      </div>
    </aside>

    <main id="konten-utama" class="nk-auth__main" tabindex="-1">
      <RouterLink
        class="nk-logo nk-auth__logo"
        :to="{ name: 'landing' }"
        aria-label="Niskala Daisy, beranda"
      >
        <img src="/brand/niskala-daisy-logo.png" alt="" width="1080" height="1080" />
      </RouterLink>
      <div class="nk-auth__card">
        <slot />
      </div>
    </main>
  </div>
</template>
