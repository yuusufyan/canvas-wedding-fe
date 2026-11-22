<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { RouterLink } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import type { AdminTemplate } from '@/types/admin'

export type TemplateAction = 'toggle-access' | 'publish' | 'archive' | 'delete'

const props = defineProps<{ template: AdminTemplate; disabled?: boolean }>()
const emit = defineEmits<{ action: [action: TemplateAction] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const menuId = useId()

function items(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) {
    trigger.value?.focus()
  }
}

function choose(action: TemplateAction): void {
  close(true)
  emit('action', action)
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
  const list = items()
  const index = list.indexOf(document.activeElement as HTMLElement)
  const next = event.key === 'ArrowDown' ? index + 1 : index - 1
  list[(next + list.length) % list.length]?.focus()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onOutside)
    await nextTick()
    items()[0]?.focus()
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
      :aria-label="`Aksi untuk ${props.template.name}`"
      :disabled="props.disabled"
      @click="open = !open"
    >
      <NkIcon name="more-horizontal" :size="20" />
    </button>
    <div
      v-if="open"
      :id="menuId"
      class="nk-menu__list"
      role="menu"
      :aria-label="`Aksi ${props.template.name}`"
    >
      <RouterLink
        role="menuitem"
        class="nk-menu__item"
        :to="{ name: 'admin-template-editor', params: { id: props.template.id } }"
        @click="close()"
      >
        <NkIcon name="edit-3" :size="16" />Edit di Canvas
      </RouterLink>
      <RouterLink
        role="menuitem"
        class="nk-menu__item"
        :to="{ name: 'demo', params: { slug: props.template.slug } }"
        @click="close()"
      >
        <NkIcon name="eye" :size="16" />Pratinjau
      </RouterLink>
      <button type="button" role="menuitem" class="nk-menu__item" @click="choose('toggle-access')">
        <NkIcon name="crown" :size="16" />{{
          props.template.access === 'Premium' ? 'Jadikan Gratis' : 'Jadikan Premium'
        }}
      </button>
      <button
        v-if="props.template.status !== 'Terbit'"
        type="button"
        role="menuitem"
        class="nk-menu__item"
        @click="choose('publish')"
      >
        <NkIcon name="check-circle" :size="16" />{{
          props.template.status === 'Arsip' ? 'Pulihkan' : 'Terbitkan'
        }}
      </button>
      <hr class="nk-menu__sep" />
      <button
        v-if="props.template.status !== 'Arsip'"
        type="button"
        role="menuitem"
        class="nk-menu__item"
        @click="choose('archive')"
      >
        <NkIcon name="archive" :size="16" />Arsipkan
      </button>
      <button
        type="button"
        role="menuitem"
        class="nk-menu__item nk-menu__item--danger"
        @click="choose('delete')"
      >
        <NkIcon name="trash-2" :size="16" />Hapus
      </button>
    </div>
  </div>
</template>
