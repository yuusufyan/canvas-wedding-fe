<script setup lang="ts">
import type { CSSProperties } from 'vue'
import CountdownBoxes from '@/components/CountdownBoxes.vue'
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  type InvitationElement,
  type InvitationPage,
} from '@/types/invitation-document'

const props = withDefaults(
  defineProps<{
    page: InvitationPage
    /** Tampilan hiasan (thumbnail): disembunyikan dari pembaca layar. */
    decorative?: boolean
    /** Animasi masuk elemen (dimatikan CSS bila gerak dikurangi). */
    animated?: boolean
  }>(),
  { decorative: false, animated: false },
)

const SAFE_COLOR = /^(#[0-9a-f]{3,8}|[a-z]+)$/i
const ARCH_BOTTOM_RADIUS = 3.4

// Nilai warna berasal dari data template; hanya bentuk hex/nama yang diteruskan ke style.
function safeColor(value: string, fallback: string): string {
  return SAFE_COLOR.test(value) ? value : fallback
}

function cqw(logical: number): string {
  return `${(logical / PAGE_WIDTH) * 100}cqw`
}

function box(el: InvitationElement, index: number): CSSProperties {
  return {
    left: `${(el.x / PAGE_WIDTH) * 100}%`,
    top: `${(el.y / PAGE_HEIGHT) * 100}%`,
    width: `${(el.width / PAGE_WIDTH) * 100}%`,
    height: `${(el.height / PAGE_HEIGHT) * 100}%`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    ['--nk-delay' as string]: `${index * 90}ms`,
  }
}

function style(el: InvitationElement, index: number): CSSProperties {
  const base = box(el, index)
  switch (el.type) {
    case 'text':
      return {
        ...base,
        color: safeColor(el.color, '#000'),
        fontSize: cqw(el.size),
        textAlign: el.align,
        fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : undefined,
        lineHeight: el.line_height !== undefined ? String(el.line_height) : undefined,
        letterSpacing: el.letter_spacing !== undefined ? `${el.letter_spacing}em` : undefined,
        textTransform: el.uppercase ? 'uppercase' : undefined,
      }
    case 'shape': {
      const fill = safeColor(el.fill, 'transparent')
      const border = el.border ? `1px solid ${safeColor(el.border, 'transparent')}` : undefined
      if (el.shape === 'arch') {
        const top = cqw(el.width / 2)
        const bottom = `${ARCH_BOTTOM_RADIUS}cqw`
        return {
          ...base,
          background: fill,
          border,
          borderRadius: `${top} ${top} ${bottom} ${bottom}`,
        }
      }
      return {
        ...base,
        background: fill,
        border,
        borderRadius: el.radius !== undefined ? cqw(el.radius) : undefined,
      }
    }
    case 'countdown':
      return { ...base, color: safeColor(el.color, '#000') }
    case 'button':
      return {
        ...base,
        background: safeColor(el.fill, 'transparent'),
        color: safeColor(el.color, '#000'),
        borderRadius: el.radius !== undefined ? cqw(el.radius) : undefined,
      }
  }
}
</script>

<template>
  <div
    class="nk-stage"
    :class="{ 'nk-stage--animated': props.animated }"
    :style="{ background: safeColor(props.page.background, '#fff') }"
    :role="props.decorative ? undefined : 'img'"
    :aria-label="props.decorative ? undefined : `Halaman undangan: ${props.page.title}`"
    :aria-hidden="props.decorative ? 'true' : undefined"
  >
    <template v-for="(el, index) in props.page.elements" :key="el.id">
      <p
        v-if="el.type === 'text'"
        class="nk-el nk-el--text"
        :class="`nk-font-${el.font}`"
        :style="style(el, index)"
      >
        {{ el.text }}
      </p>
      <div v-else-if="el.type === 'shape'" class="nk-el" :style="style(el, index)"></div>
      <CountdownBoxes
        v-else-if="el.type === 'countdown'"
        class="nk-el nk-el--countdown"
        :target="el.target"
        :style="style(el, index)"
      />
      <span v-else-if="el.type === 'button'" class="nk-el nk-el--button" :style="style(el, index)">
        {{ el.label }}
      </span>
    </template>
  </div>
</template>
