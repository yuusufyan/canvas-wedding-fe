<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listPublicTemplates } from '@/api/publicTemplates'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import NkIcon from '@/components/NkIcon.vue'
import { useAsyncState } from '@/composables/useAsyncState'

const GALLERY_SIZE = 4
const SKELETON_COUNT = 4

const { status, data, load } = useAsyncState(async () => {
  const result = await listPublicTemplates(GALLERY_SIZE)
  return result.data
})

onMounted(load)
</script>

<template>
  <section id="template" class="nk-section" aria-labelledby="template-title">
    <div class="nk-container">
      <p class="nk-eyebrow">Template</p>
      <h2 id="template-title" class="nk-h2">Mulai dari desain yang sudah cantik.</h2>

      <div v-if="status === 'loading' || status === 'idle'" data-testid="gallery-loading">
        <p class="nk-visually-hidden" role="status">Memuat template…</p>
        <ul class="nk-gallery" aria-hidden="true">
          <li v-for="n in SKELETON_COUNT" :key="n">
            <div class="nk-skeleton nk-tcard__media"></div>
          </li>
        </ul>
      </div>

      <ErrorState
        v-else-if="status === 'error' || status === 'not-found'"
        title="Template belum bisa dimuat"
        @retry="load"
      />

      <EmptyState
        v-else-if="!data || data.length === 0"
        title="Template segera hadir"
        message="Kami sedang menyiapkan koleksi template. Silakan kembali lagi sebentar lagi."
      />

      <ul v-else class="nk-gallery" data-testid="gallery-list">
        <li v-for="template in data" :key="template.slug">
          <RouterLink
            class="nk-tcard__media"
            :to="{ name: 'demo', params: { slug: template.slug } }"
            :aria-label="`Lihat demo template ${template.name}`"
          >
            <span
              class="nk-tcard__tag nk-tag"
              :class="template.access === 'Premium' ? 'nk-tag--premium' : 'nk-tag--free'"
            >
              <NkIcon v-if="template.access === 'Premium'" name="crown" :size="12" />
              {{ template.access }}
            </span>
            <InvitationRenderer :page="template.cover" decorative />
          </RouterLink>
          <div class="nk-tcard__foot">
            <span class="nk-tcard__name">{{ template.name }}</span>
            <RouterLink
              class="nk-tcard__use"
              :to="{ name: 'login', query: { template: template.slug } }"
              :aria-label="`Gunakan template ${template.name}`"
            >
              Gunakan
            </RouterLink>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
