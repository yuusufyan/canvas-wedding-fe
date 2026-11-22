<script setup lang="ts">
import { computed, ref } from 'vue'
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import NkIcon from '@/components/NkIcon.vue'
import { formatClock, usePlayer } from '@/composables/usePlayer'
import type { TemplateDemo } from '@/types/template'

const props = defineProps<{ demo: TemplateDemo }>()

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

const pages = computed(() => props.demo.document.pages)

const player = usePlayer({
  totalSeconds: () => props.demo.duration_seconds,
  pageCount: () => pages.value.length,
  autoStart: !prefersReducedMotion(),
})
const { playing, auto, currentIndex, elapsed, total } = player

const currentPage = computed(() => pages.value[currentIndex.value] ?? pages.value[0])
const stageRoot = ref<HTMLElement | null>(null)

function onSeek(event: Event): void {
  player.seek(Number((event.target as HTMLInputElement).value))
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    void stageRoot.value?.requestFullscreen?.()
  }
}
</script>

<template>
  <div class="nk-demo__body">
    <nav class="nk-demo__sections" aria-label="Bagian undangan">
      <h2 class="nk-demo__side-title">Bagian undangan</h2>
      <ul class="nk-sections">
        <li v-for="(page, index) in pages" :key="page.id">
          <button
            type="button"
            :class="{ 'is-active': index === currentIndex }"
            :aria-current="index === currentIndex ? 'true' : undefined"
            @click="player.seekToPage(index)"
          >
            <span class="nk-sections__num">
              <NkIcon v-if="index < currentIndex" name="check" :size="14" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            {{ page.title }}
          </button>
        </li>
      </ul>
    </nav>

    <div ref="stageRoot" class="nk-demo__phone">
      <div class="nk-phone">
        <Transition name="nk-fade" mode="out-in">
          <InvitationRenderer
            v-if="currentPage"
            :key="currentPage.id"
            :page="currentPage"
            animated
          />
        </Transition>
      </div>
    </div>

    <section class="nk-demo__about" aria-labelledby="demo-about">
      <h2 class="nk-demo__side-title" id="demo-about">Tentang template</h2>
      <div class="nk-demo__about-head">
        <h3 class="nk-demo__name">{{ props.demo.name }}</h3>
        <span
          class="nk-tag"
          :class="props.demo.access === 'Premium' ? 'nk-tag--gold' : 'nk-tag--free'"
        >
          <NkIcon v-if="props.demo.access === 'Premium'" name="crown" :size="12" />
          {{ props.demo.access }}
        </span>
      </div>
      <p>{{ props.demo.description }}</p>
      <ul class="nk-demo__facts">
        <li v-if="props.demo.animation_label">
          <NkIcon name="sparkles" :size="18" />Animasi: {{ props.demo.animation_label }}
        </li>
        <li v-if="props.demo.has_music"><NkIcon name="music" :size="18" />Musik latar: aktif</li>
        <li v-if="props.demo.has_rsvp"><NkIcon name="users" :size="18" />RSVP &amp; ucapan tamu</li>
      </ul>
    </section>
  </div>

  <div class="nk-demo__controls" role="group" aria-label="Kontrol pemutar demo">
    <div class="nk-timeline">
      <span
        v-for="(page, index) in pages"
        :key="page.id"
        class="nk-timeline__seg"
        aria-hidden="true"
      >
        <i :style="{ width: `${player.progressOf(index) * 100}%` }"></i>
      </span>
      <input
        class="nk-timeline__range"
        type="range"
        min="0"
        :max="total"
        step="0.1"
        :value="elapsed"
        aria-label="Posisi pemutaran"
        :aria-valuetext="`Bagian ${currentIndex + 1} dari ${pages.length}: ${currentPage?.title ?? ''}`"
        @input="onSeek"
      />
    </div>
    <div class="nk-controls__row">
      <span class="nk-controls__time">{{ formatClock(elapsed) }} / {{ formatClock(total) }}</span>
      <div class="nk-controls__main">
        <button type="button" class="nk-ctl" aria-label="Bagian sebelumnya" @click="player.prev()">
          <NkIcon name="skip-back" :size="22" />
        </button>
        <button
          type="button"
          class="nk-ctl nk-ctl--play"
          :aria-label="playing ? 'Jeda' : 'Putar'"
          @click="player.toggle()"
        >
          <NkIcon :name="playing ? 'pause' : 'play'" :size="26" />
        </button>
        <button type="button" class="nk-ctl" aria-label="Bagian berikutnya" @click="player.next()">
          <NkIcon name="skip-forward" :size="22" />
        </button>
      </div>
      <div class="nk-controls__right">
        <span id="demo-auto-label" class="nk-controls__label">Otomatis</span>
        <button
          type="button"
          class="nk-switch"
          role="switch"
          aria-labelledby="demo-auto-label"
          :aria-checked="auto"
          @click="auto = !auto"
        ></button>
        <button type="button" class="nk-ctl" aria-label="Layar penuh" @click="toggleFullscreen">
          <NkIcon name="maximize" :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>
