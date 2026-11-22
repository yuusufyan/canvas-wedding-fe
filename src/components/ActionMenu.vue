<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import NkIcon from '@/components/NkIcon.vue'
import type { NkIconName } from '@/constants/nk-icons'

export interface ActionItem {
  key: string
  label: string
  icon: NkIconName
  danger?: boolean
  /** Pemisah di atas item ini. */
  separated?: boolean
}

const props = defineProps<{ items: ActionItem[]; label: string; disabled?: boolean }>()
const emit = defineEmits<{ select: [key: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const menuId = useId()

function entries(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) {
    trigger.value?.focus()
  }
}

function choose(key: string): void {
  close(true)
  emit('select', key)
}

function onOutside(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close(true)
    return
  }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return
  }
  event.preventDefault()
  const list = entries()
  const index = list.indexOf(document.activeElement as HTMLElement)
  const next = event.key === 'ArrowDown' ? index + 1 : index - 1
  list[(next + list.length) % list.length]?.focus()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onOutside)
    await nextTick()
    entries()[0]?.focus()
  } else {
    document.removeEventListener('mousedown', onOutside)
  }
})

onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div ref="root" class="nk-menu" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      class="nk-iconbtn"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      :aria-label="props.label"
      :disabled="props.disabled"
      @click="open = !open"
    >
      <NkIcon name="more-horizontal" :size="20" />
    </button>
    <div v-if="open" :id="menuId" class="nk-menu__list" role="menu" :aria-label="props.label">
      <template v-for="item in props.items" :key="item.key">
        <hr v-if="item.separated" class="nk-menu__sep" />
        <button
          type="button"
          role="menuitem"
          class="nk-menu__item"
          :class="{ 'nk-menu__item--danger': item.danger }"
          @click="choose(item.key)"
        >
          <NkIcon :name="item.icon" :size="16" />{{ item.label }}
        </button>
      </template>
    </div>
  </div>
</template>
