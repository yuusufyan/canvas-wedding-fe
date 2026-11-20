<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FeatherIcon from '@/components/FeatherIcon.vue'
import { usePermission } from '@/composables/usePermission'
import { useAuthStore } from '@/stores/auth'

const OVERLAY_BREAKPOINT = 1200

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { canManageUsers, canManageRoles } = usePermission()

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const isOverlayBreakpoint = ref(false)
const dropdownOpen = ref(false)
const loggingOut = ref(false)

const dropdownRoot = ref<HTMLElement | null>(null)
const dropdownToggle = ref<HTMLButtonElement | null>(null)

const avatarInitial = computed(() => authStore.profile?.name.charAt(0).toUpperCase() ?? '')

interface MenuItem {
  name: string
  label: string
  icon: 'home' | 'users' | 'shield'
  activeRoutes: string[]
}

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { name: 'home', label: 'Beranda', icon: 'home', activeRoutes: ['home'] },
  ]
  if (canManageUsers.value) {
    items.push({ name: 'users', label: 'Pengguna', icon: 'users', activeRoutes: ['users'] })
  }
  if (canManageRoles.value) {
    items.push({ name: 'roles', label: 'Role', icon: 'shield', activeRoutes: ['roles'] })
  }
  return items
})

const navToggleLabel = computed(() => {
  if (isOverlayBreakpoint.value) {
    return 'Tutup menu navigasi'
  }
  return sidebarCollapsed.value ? 'Perluas menu' : 'Ciutkan menu'
})

function closeMobileMenu(): void {
  mobileMenuOpen.value = false
  document.body.classList.remove('menu-open')
  document.body.classList.add('menu-hide')
}

function openMobileMenu(): void {
  mobileMenuOpen.value = true
  document.body.classList.remove('menu-hide')
  document.body.classList.add('menu-open')
}

function toggleMobileMenu(): void {
  if (mobileMenuOpen.value) {
    closeMobileMenu()
  } else {
    openMobileMenu()
  }
}

function toggleCollapse(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
  document.body.classList.toggle('menu-collapsed', sidebarCollapsed.value)
}

function handleNavToggleClick(): void {
  if (isOverlayBreakpoint.value) {
    closeMobileMenu()
  } else {
    toggleCollapse()
  }
}

function handleResize(): void {
  const overlay = window.innerWidth < OVERLAY_BREAKPOINT
  isOverlayBreakpoint.value = overlay
  document.body.classList.toggle('vertical-overlay-menu', overlay)
  if (!overlay && mobileMenuOpen.value) {
    closeMobileMenu()
  }
}

function toggleDropdown(): void {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdownAndRefocus(): void {
  if (!dropdownOpen.value) {
    return
  }
  dropdownOpen.value = false
  dropdownToggle.value?.focus()
}

function handleDocumentClick(event: MouseEvent): void {
  if (dropdownOpen.value && !dropdownRoot.value?.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeDropdownAndRefocus()
  }
}

async function handleLogout(): Promise<void> {
  if (loggingOut.value) {
    return
  }
  loggingOut.value = true
  try {
    await authStore.logout()
  } finally {
    loggingOut.value = false
    router.push({ name: 'login' })
  }
}

onMounted(() => {
  document.body.classList.remove('blank-page')
  document.body.dataset.col = ''
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  document.body.classList.remove('menu-collapsed', 'menu-open', 'vertical-overlay-menu')
  document.body.classList.add('menu-hide')
})
</script>

<template>
  <a class="skip-link visually-hidden-focusable btn btn-primary" href="#konten-utama"
    >Lompat ke konten utama</a
  >

  <nav
    class="header-navbar navbar navbar-expand-lg align-items-center floating-nav navbar-light navbar-shadow container-xxl"
  >
    <div class="navbar-container d-flex content">
      <ul class="nav navbar-nav d-xl-none">
        <li class="nav-item">
          <button
            type="button"
            class="nav-link btn btn-link"
            :aria-label="mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'"
            @click="toggleMobileMenu"
          >
            <FeatherIcon name="menu" :size="20" class="ficon" />
          </button>
        </li>
      </ul>

      <ul class="nav navbar-nav align-items-center ms-auto">
        <li
          ref="dropdownRoot"
          class="nav-item dropdown dropdown-user"
          :class="{ show: dropdownOpen }"
        >
          <button
            id="dropdown-user"
            ref="dropdownToggle"
            type="button"
            class="nav-link dropdown-toggle dropdown-user-link btn btn-link d-flex align-items-center"
            aria-haspopup="true"
            :aria-expanded="dropdownOpen"
            @click="toggleDropdown"
          >
            <div class="user-nav d-sm-flex d-none flex-column align-items-end me-75">
              <span class="user-name fw-bolder">{{ authStore.profile?.name }}</span>
              <span class="user-status">{{ authStore.profile?.role.name }}</span>
            </div>
            <span class="avatar bg-light-primary">
              <span class="avatar-content">{{ avatarInitial }}</span>
            </span>
          </button>
          <div
            class="dropdown-menu dropdown-menu-end"
            :class="{ show: dropdownOpen }"
            aria-labelledby="dropdown-user"
          >
            <button
              type="button"
              class="dropdown-item"
              :aria-disabled="loggingOut"
              :disabled="loggingOut"
              @click="handleLogout"
            >
              <FeatherIcon name="log-out" class="me-50" />{{ loggingOut ? 'Keluar…' : 'Keluar' }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </nav>

  <div
    class="main-menu menu-fixed menu-light menu-accordion menu-shadow"
    data-scroll-to-active="true"
    role="navigation"
    aria-label="Menu utama"
  >
    <div class="navbar-header">
      <ul class="nav navbar-nav flex-row">
        <li class="nav-item me-auto">
          <RouterLink class="navbar-brand" :to="{ name: 'home' }">
            <span class="brand-logo"
              ><img src="/vuexy/app-assets/images/logo/logo.svg" alt="" height="24"
            /></span>
            <h2 class="brand-text text-nowrap">Canvas Wedding</h2>
          </RouterLink>
        </li>
        <li class="nav-item nav-toggle">
          <button
            type="button"
            class="nav-link modern-nav-toggle pe-0 btn btn-link"
            :aria-label="navToggleLabel"
            @click="handleNavToggleClick"
          >
            <FeatherIcon name="x" :size="20" class="d-block d-xl-none text-primary toggle-icon" />
            <FeatherIcon
              name="disc"
              :size="20"
              class="d-none d-xl-block collapse-toggle-icon text-primary"
            />
          </button>
        </li>
      </ul>
    </div>
    <div class="shadow-bottom"></div>
    <div class="main-menu-content">
      <ul class="navigation navigation-main" id="main-menu-navigation" data-menu="menu-navigation">
        <li
          v-for="item in menuItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: item.activeRoutes.includes(String(route.name)) }"
        >
          <RouterLink
            class="d-flex align-items-center"
            :to="{ name: item.name }"
            @click="closeMobileMenu"
          >
            <FeatherIcon :name="item.icon" />
            <span class="menu-title text-truncate">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>

  <main id="konten-utama" class="app-content content" tabindex="-1">
    <div
      class="content-overlay"
      :class="{ 'show-overlay': mobileMenuOpen }"
      @click="closeMobileMenu"
    ></div>
    <div class="header-navbar-shadow"></div>
    <div class="content-wrapper container-xxl p-0">
      <div class="content-body">
        <slot />
      </div>
    </div>
  </main>

  <div class="sidenav-overlay"></div>
  <div class="drag-target"></div>
</template>
