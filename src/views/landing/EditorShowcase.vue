<script setup lang="ts">
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import NkIcon from '@/components/NkIcon.vue'
import { HERO_PREVIEW_PAGE, LANDING_EDITOR_LAYERS, LANDING_FEATURES } from '@/constants/landing'
</script>

<template>
  <section class="nk-section nk-editor-band nk-dark" aria-labelledby="editor-title">
    <div class="nk-container">
      <p class="nk-eyebrow">Editor</p>
      <h2 id="editor-title" class="nk-h2">
        Seret, lepas, selesai. Sebebas kamu mendesain di Canva.
      </h2>

      <div
        class="nk-editor-win"
        role="img"
        aria-label="Tampilan editor Canvas dengan halaman undangan Rustic"
      >
        <div class="nk-editor-win__bar">
          <span>Hilbert &amp; Hilda &ndash; Rustic</span>
          <span class="nk-editor-win__publish">Publikasikan</span>
        </div>
        <div class="nk-editor-win__body">
          <div class="nk-editor-win__panel">
            <div class="nk-editor-win__search">Cari font dan gaya teks</div>
            <div class="nk-editor-win__add">Tambah kotak teks</div>
            <div class="nk-editor-win__style">Tambah judul</div>
            <div class="nk-editor-win__style nk-editor-win__style--sub">Tambah subjudul</div>
            <div class="nk-editor-win__style nk-editor-win__style--body">Tambah teks isi</div>
          </div>
          <div class="nk-editor-win__canvas">
            <div class="nk-editor-win__page">
              <InvitationRenderer :page="HERO_PREVIEW_PAGE" decorative />
              <div class="nk-editor-win__sel"><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
          <div class="nk-editor-win__panel">
            <p class="nk-editor-win__layers-title">Layer</p>
            <p
              v-for="(layer, index) in LANDING_EDITOR_LAYERS"
              :key="layer"
              class="nk-editor-win__layer"
              :class="{ 'is-active': index === 0 }"
            >
              {{ layer }}
            </p>
          </div>
        </div>
        <div class="nk-editor-win__tools">
          <NkIcon name="type" :size="20" />
          <NkIcon name="mouse-pointer" :size="20" />
          <NkIcon name="users" :size="20" />
          <NkIcon name="music" :size="20" />
        </div>
      </div>

      <ul class="nk-features">
        <li v-for="feature in LANDING_FEATURES" :key="feature.title" class="nk-feature">
          <NkIcon :name="feature.icon" :size="24" />
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>
