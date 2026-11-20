<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import NkIcon from '@/components/NkIcon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    /** Request berjalan: Esc, klik latar, dan tombol tutup dinonaktifkan. */
    busy?: boolean
    size?: 'sm' | 'md'
  }>(),
  { description: undefined, busy: false, size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const uid = useId()
const titleId = `${uid}-title`
const descId = `${uid}-desc`
const panel = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function requestClose(): void {
  if (!props.busy) {
    emit('close')
  }
}

function focusables(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    requestClose()
    return
  }
  if (event.key !== 'Tab') {
    return
  }
  const items = focusables()
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) {
    event.preventDefault()
    panel.value?.focus()
    return
  }
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === panel.value)
  ) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function lockScroll(locked: boolean): void {
  document.body.classList.toggle('nk-modal-open', locked)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      lockScroll(true)
      await nextTick()
      // Fokus awal ke kontrol pertama selain tombol tutup; bila tidak ada, ke panel.
      const target = focusables().find((el) => !el.hasAttribute('data-dialog-close'))
      ;(target ?? panel.value)?.focus()
    } else {
      lockScroll(false)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.open) {
    lockScroll(false)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="nk-modal" @mousedown.self="requestClose">
      <div
        ref="panel"
        class="nk-modal__panel"
        :class="`nk-modal__panel--${props.size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="props.description ? descId : undefined"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <button
          type="button"
          class="nk-modal__close"
          data-dialog-close
          aria-label="Tutup"
          :disabled="props.busy"
          @click="requestClose"
        >
          <NkIcon name="x" :size="20" />
        </button>
        <div class="nk-modal__head">
          <slot name="icon" />
          <h2 :id="titleId" class="nk-modal__title">{{ props.title }}</h2>
          <p v-if="props.description" :id="descId" class="nk-modal__desc">
            {{ props.description }}
          </p>
        </div>
        <div class="nk-modal__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="nk-modal__foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
