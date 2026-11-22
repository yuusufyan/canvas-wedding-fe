<script setup lang="ts">
import { computed } from 'vue'
import NkIcon from '@/components/NkIcon.vue'
import { formatNumber } from '@/utils/relative-time'

const props = defineProps<{ page: number; limit: number; total: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const WINDOW = 5

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const to = computed(() => Math.min(props.total, props.page * props.limit))

const pages = computed(() => {
  const start = Math.max(1, Math.min(props.page - 2, pageCount.value - WINDOW + 1))
  const end = Math.min(pageCount.value, start + WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function go(next: number): void {
  if (next >= 1 && next <= pageCount.value && next !== props.page) {
    emit('update:page', next)
  }
}
</script>

<template>
  <nav class="nk-pager" aria-label="Paginasi">
    <p class="nk-pager__info" aria-live="polite">
      Menampilkan {{ formatNumber(from) }}&ndash;{{ formatNumber(to) }} dari
      {{ formatNumber(total) }}
    </p>
    <ul v-if="pageCount > 1" class="nk-pager__list">
      <li>
        <button
          type="button"
          class="nk-pager__btn"
          aria-label="Halaman sebelumnya"
          :disabled="page <= 1"
          @click="go(page - 1)"
        >
          <NkIcon name="chevron-left" :size="16" />
        </button>
      </li>
      <li v-for="n in pages" :key="n">
        <button
          type="button"
          class="nk-pager__btn"
          :class="{ 'is-active': n === page }"
          :aria-current="n === page ? 'page' : undefined"
          :aria-label="`Halaman ${n}`"
          @click="go(n)"
        >
          {{ n }}
        </button>
      </li>
      <li>
        <button
          type="button"
          class="nk-pager__btn"
          aria-label="Halaman berikutnya"
          :disabled="page >= pageCount"
          @click="go(page + 1)"
        >
          <NkIcon name="chevron-right" :size="16" />
        </button>
      </li>
    </ul>
  </nav>
</template>
