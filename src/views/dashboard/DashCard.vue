<script setup lang="ts">
import { useId } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'
import type { AsyncStatus } from '@/composables/useAsyncState'

// Kartu dashboard dengan state sendiri: satu kartu gagal tidak merusak yang lain.
const titleId = useId()

defineProps<{
  title: string
  subtitle?: string
  status: AsyncStatus
  empty?: boolean
  emptyText?: string
  linkLabel?: string
  to?: RouteLocationRaw
}>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="nk-card nk-dashcard" :aria-labelledby="titleId" :aria-busy="status === 'loading'">
    <header class="nk-card__head">
      <div>
        <h2 :id="titleId" class="nk-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="nk-card__sub">{{ subtitle }}</p>
      </div>
      <slot name="meta" />
      <RouterLink v-if="linkLabel && to" class="nk-card__link" :to="to">{{ linkLabel }}</RouterLink>
    </header>

    <div v-if="status === 'loading' || status === 'idle'" class="nk-skeleton nk-dashcard__skeleton">
      <span class="nk-visually-hidden" role="status">Memuat {{ title }}…</span>
    </div>
    <div v-else-if="status !== 'ready'" class="nk-dashcard__state" role="alert">
      <p>
        {{
          status === 'forbidden'
            ? 'Kamu tidak punya akses ke data ini.'
            : `${title} belum bisa dimuat.`
        }}
      </p>
      <button
        v-if="status !== 'forbidden'"
        type="button"
        class="nk-appbtn nk-appbtn--outline nk-appbtn--sm"
        @click="emit('retry')"
      >
        Coba lagi
      </button>
    </div>
    <p v-else-if="empty" class="nk-dashcard__empty">{{ emptyText ?? 'Belum ada data.' }}</p>
    <slot v-else />
  </section>
</template>
