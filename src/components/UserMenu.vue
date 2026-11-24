<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import NkIcon from '@/components/NkIcon.vue'
import { useAuthStore } from '@/stores/auth'

defineProps<{ busy?: boolean }>()
const emit = defineEmits<{ logout: [] }>()

const authStore = useAuthStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const menuId = useId()

const name = computed(() => authStore.profile?.name ?? '')
const roleName = computed(() => authStore.profile?.role ?? '')
const initial = computed(() => name.value.charAt(0).toUpperCase())

function close(returnFocus = false): void {
  open.value = false
  if (returnFocus) {
    trigger.value?.focus()
  }
}

function onOutside(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation()
    close(true)
  }
}

function logout(): void {
  close()
  emit('logout')
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onOutside)
    await nextTick()
    root.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  } else {
    document.removeEventListener('mousedown', onOutside)
  }
})

onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div ref="root" class="nk-usermenu" @keydown="onKeydown">
    <button
      ref="trigger"
      type="button"
      class="nk-usermenu__trigger"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      :aria-label="`Menu akun ${name}`"
      @click="open = !open"
    >
      <span class="nk-usermenu__avatar" aria-hidden="true">{{ initial }}</span>
      <span class="nk-usermenu__text">
        <strong>{{ name }}</strong>
        <small>{{ roleName }}</small>
      </span>
      <NkIcon name="chevron-down" :size="16" />
    </button>
    <div v-if="open" :id="menuId" class="nk-menu__list nk-usermenu__list" role="menu">
      <button
        type="button"
        role="menuitem"
        class="nk-menu__item nk-menu__item--danger"
        :disabled="busy"
        @click="logout"
      >
        <NkIcon name="log-out" :size="16" />{{ busy ? 'Keluar…' : 'Keluar' }}
      </button>
    </div>
  </div>
</template>
