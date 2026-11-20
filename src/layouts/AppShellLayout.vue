<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import NkIcon from '@/components/NkIcon.vue'
import ToastHost from '@/components/ToastHost.vue'
import { MENU_ICON_FALLBACK, MENU_ICONS } from '@/constants/menu-icons'
import { ROLES } from '@/constants/roles'
import { useAuthStore } from '@/stores/auth'
import type { MenuItem } from '@/types/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)
const loggingOut = ref(false)
const toggleButton = ref<HTMLButtonElement | null>(null)
const sidebar = ref<HTMLElement | null>(null)

// Menu cadangan saat /auth/me belum mengirim menus[] (backend lama): hanya rute yang ada.
const FALLBACK_MENUS: MenuItem[] = [
  {
    key: 'fallback.home',
    label: 'Beranda',
    path: '/dashboard',
    icon: 'home',
    parent_key: null,
    sort_order: 10,
  },
]
const FALLBACK_ADMIN_MENUS: MenuItem[] = [
  {
    key: 'fallback.users',
    label: 'Pengguna',
    path: '/users',
    icon: 'users',
    parent_key: null,
    sort_order: 20,
  },
  {
    key: 'fallback.roles',
    label: 'Role',
    path: '/roles',
    icon: 'user-cog',
    parent_key: null,
    sort_order: 30,
  },
]

interface MenuNode {
  item: MenuItem
  children: MenuItem[]
}

function bySort(a: MenuItem, b: MenuItem): number {
  return a.sort_order - b.sort_order || a.key.localeCompare(b.key)
}

const menuTree = computed<MenuNode[]>(() => {
  const source =
    authStore.menus.length > 0
      ? authStore.menus
      : authStore.isSuperAdmin
        ? [...FALLBACK_MENUS, ...FALLBACK_ADMIN_MENUS]
        : FALLBACK_MENUS
  const parents = source.filter((m) => !m.parent_key).sort(bySort)
  return parents.map((item) => ({
    item,
    children: source.filter((m) => m.parent_key === item.key).sort(bySort),
  }))
})

const avatarInitial = computed(() => authStore.profile?.name.charAt(0).toUpperCase() ?? '')
const roleLabel = computed(() => authStore.profile?.role.name ?? ROLES.SUPERADMIN)

function iconFor(item: MenuItem) {
  return (item.icon && MENU_ICONS[item.icon]) || MENU_ICON_FALLBACK
}

// Dashboard (/admin, /app) hanya aktif pada rutenya sendiri; menu lain juga aktif di sub-rute.
function isActive(path: string): boolean {
  if (route.path === path) {
    return true
  }
  return path !== '/admin' && path !== '/app' && route.path.startsWith(`${path}/`)
}

async function openMenu(): Promise<void> {
  menuOpen.value = true
  await nextTick()
  sidebar.value?.querySelector<HTMLElement>('a[href]')?.focus()
}

function closeMenu(returnFocus = false): void {
  if (!menuOpen.value) {
    return
  }
  menuOpen.value = false
  if (returnFocus) {
    toggleButton.value?.focus()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMenu(true)
  }
}

// Shell ini tidak memakai penanda halaman kosong Vuexy milik layar login.
onMounted(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
})

// Menu tertutup setiap kali navigasi.
watch(
  () => route.fullPath,
  () => closeMenu(),
)

async function logout(): Promise<void> {
  if (loggingOut.value) {
    return
  }
  loggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    loggingOut.value = false
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="nk-app" :class="{ 'is-menu-open': menuOpen }" @keydown="onKeydown">
    <a class="nk-skip" href="#konten-utama">Lompat ke konten utama</a>

    <aside id="nk-sidebar" ref="sidebar" class="nk-sidebar">
      <RouterLink
        class="nk-logo nk-sidebar__logo"
        :to="{ name: 'landing' }"
        aria-label="Niskala Daisy, beranda"
      >
        <img src="/brand/niskala-daisy-logo.png" alt="" width="1080" height="1080" />
      </RouterLink>

      <nav class="nk-sidebar__nav" aria-label="Menu utama">
        <ul>
          <li v-for="node in menuTree" :key="node.item.key">
            <RouterLink
              class="nk-navlink"
              :class="{ 'is-active': isActive(node.item.path) }"
              :to="node.item.path"
              :aria-current="isActive(node.item.path) ? 'page' : undefined"
            >
              <NkIcon :name="iconFor(node.item)" :size="20" />
              {{ node.item.label }}
            </RouterLink>
            <ul v-if="node.children.length" class="nk-sidebar__sub">
              <li v-for="child in node.children" :key="child.key">
                <RouterLink
                  class="nk-navlink"
                  :class="{ 'is-active': isActive(child.path) }"
                  :to="child.path"
                  :aria-current="isActive(child.path) ? 'page' : undefined"
                >
                  <NkIcon :name="iconFor(child)" :size="18" />
                  {{ child.label }}
                </RouterLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <div class="nk-usercard">
        <span class="nk-usercard__avatar" aria-hidden="true">{{ avatarInitial }}</span>
        <span class="nk-usercard__text">
          <strong>{{ authStore.profile?.name }}</strong>
          <small>{{ roleLabel }}</small>
        </span>
        <button
          type="button"
          class="nk-usercard__logout"
          aria-label="Keluar"
          :disabled="loggingOut"
          @click="logout"
        >
          <NkIcon name="log-out" :size="18" />
        </button>
      </div>
    </aside>

    <div
      v-if="menuOpen"
      class="nk-backdrop"
      data-testid="shell-backdrop"
      @click="closeMenu(true)"
    ></div>

    <div class="nk-app__main">
      <header class="nk-topbar">
        <button
          ref="toggleButton"
          type="button"
          class="nk-topbar__menu"
          aria-controls="nk-sidebar"
          :aria-expanded="menuOpen"
          :aria-label="menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
          @click="menuOpen ? closeMenu(true) : openMenu()"
        >
          <NkIcon :name="menuOpen ? 'x' : 'menu'" :size="22" />
        </button>
        <RouterLink
          class="nk-logo nk-topbar__logo"
          :to="{ name: 'landing' }"
          aria-label="Niskala Daisy, beranda"
        >
          <img src="/brand/niskala-daisy-logo.png" alt="" width="1080" height="1080" />
        </RouterLink>
      </header>

      <main id="konten-utama" class="nk-app__content" tabindex="-1">
        <slot />
      </main>
    </div>

    <ToastHost />
  </div>
</template>
