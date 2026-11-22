<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getTemplateDemo } from '@/api/publicTemplates'
import DemoPlayer from '@/components/DemoPlayer.vue'
import ErrorState from '@/components/ErrorState.vue'
import NkIcon from '@/components/NkIcon.vue'
import { useAsyncState } from '@/composables/useAsyncState'

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug ?? ''))

const { status, data, load } = useAsyncState(() => getTemplateDemo(slug.value))
const shareNotice = ref('')

onMounted(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
  void load()
})
watch(slug, () => void load())

function closeDemo(): void {
  // Tombol tutup kembali ke halaman asal bila ada, selain itu ke landing.
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.push({ name: 'landing' })
  }
}

async function shareDemo(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareNotice.value = 'Tautan demo disalin'
  } catch {
    shareNotice.value = 'Tautan tidak bisa disalin otomatis'
  }
}
</script>

<template>
  <div class="nk-demo">
    <a class="nk-skip" href="#konten-utama">Lompat ke konten utama</a>
    <header class="nk-demo__top">
      <button type="button" class="nk-demo__close" aria-label="Tutup demo" @click="closeDemo">
        <NkIcon name="x" :size="20" />
      </button>
      <div class="nk-demo__title">
        <h1>
          Demo undangan<template v-if="data"> &middot; {{ data.couple_label }}</template>
        </h1>
        <p v-if="data">
          Template {{ data.name }} &middot; cuplikan {{ data.duration_seconds }} detik
        </p>
      </div>
      <div class="nk-demo__actions">
        <button
          v-if="data"
          type="button"
          class="nk-btn nk-btn--ghost-light nk-btn--sm"
          aria-label="Bagikan demo"
          @click="shareDemo"
        >
          <NkIcon name="share-2" :size="16" />
          <span class="nk-demo__label">Bagikan demo</span>
        </button>
        <RouterLink
          v-if="data"
          class="nk-btn nk-btn--gold nk-btn--sm"
          :to="{ name: 'login', query: { template: data.slug } }"
        >
          Pakai template ini
          <NkIcon name="arrow-right" :size="16" />
        </RouterLink>
      </div>
    </header>
    <p class="nk-live nk-container" role="status">{{ shareNotice }}</p>

    <main id="konten-utama" class="nk-demo__main" tabindex="-1">
      <div
        v-if="status === 'loading' || status === 'idle'"
        class="nk-container"
        data-testid="demo-loading"
      >
        <p class="nk-visually-hidden" role="status">Memuat demo…</p>
        <div class="nk-skeleton nk-demo__skeleton" aria-hidden="true"></div>
      </div>

      <div v-else-if="status === 'not-found'" class="nk-container">
        <div class="nk-state">
          <h2>Demo tidak ditemukan</h2>
          <p>Template ini tidak tersedia atau sudah tidak dipublikasikan.</p>
          <RouterLink class="nk-btn nk-btn--gold nk-btn--sm" :to="{ name: 'landing' }">
            Kembali ke beranda
          </RouterLink>
        </div>
      </div>

      <div v-else-if="status === 'error' || !data" class="nk-container">
        <ErrorState title="Demo belum bisa dimuat" @retry="load" />
      </div>

      <DemoPlayer v-else :key="data.slug" :demo="data" />
    </main>
  </div>
</template>
