<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getRoleMenus,
  getRolePermissions,
  listCatalogMenus,
  listPermissions,
  setRoleMenus,
  setRolePermissions,
} from '@/api/access'
import { getRole } from '@/api/roles'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import NkIcon from '@/components/NkIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { MENU_ICON_FALLBACK, MENU_ICONS } from '@/constants/menu-icons'
import { ROLES, isSystemRole } from '@/constants/roles'
import { useAsyncState } from '@/composables/useAsyncState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { useToast } from '@/composables/useToast'
import AppShellLayout from '@/layouts/AppShellLayout.vue'
import type { CatalogMenu, Permission } from '@/types/access'
import type { Role } from '@/types/role'
import { describeError } from '@/utils/api-error'
import {
  countChanges,
  diffSets,
  groupMenus,
  groupPermissions,
  summarizeChanges,
} from '@/utils/access'

useDocumentTitle('Atur izin & menu')

interface AccessData {
  role: Role
  permissions: Permission[]
  menus: CatalogMenu[]
  grantedPermissions: string[]
  grantedMenus: string[]
}

const route = useRoute()
const toast = useToast()
const roleId = computed(() => String(route.params.id ?? ''))

const state = useAsyncState<AccessData>(async () => {
  const [role, permissions, menus, granted, grantedMenus] = await Promise.all([
    getRole(roleId.value),
    listPermissions(),
    listCatalogMenus(),
    getRolePermissions(roleId.value),
    getRoleMenus(roleId.value),
  ])
  return {
    role,
    permissions: permissions.data,
    menus: menus.data,
    grantedPermissions: granted.permissions,
    grantedMenus: grantedMenus.menus,
  }
})

// Set terpilih (yang bisa diubah) dan set dasar (hasil muat/simpan terakhir).
const basePermissions = ref<Set<string>>(new Set())
const baseMenus = ref<Set<string>>(new Set())
const selectedPermissions = ref<Set<string>>(new Set())
const selectedMenus = ref<Set<string>>(new Set())
const saving = ref(false)
const saveError = ref('')

onMounted(async () => {
  await state.load()
  const data = state.data.value
  if (data) {
    basePermissions.value = new Set(data.grantedPermissions)
    baseMenus.value = new Set(data.grantedMenus)
    selectedPermissions.value = new Set(data.grantedPermissions)
    selectedMenus.value = new Set(data.grantedMenus)
  }
})

const role = computed(() => state.data.value?.role ?? null)
// SuperAdmin lolos semua izin lewat kode dan tidak bisa diubah: hanya mode lihat.
const readonly = computed(() => role.value?.name === ROLES.SUPERADMIN)
const system = computed(() => (role.value ? isSystemRole(role.value.name) : false))

const permissionGroups = computed(() => groupPermissions(state.data.value?.permissions ?? []))
const menuGroups = computed(() => groupMenus(state.data.value?.menus ?? []))
const permissionDiff = computed(() => diffSets(basePermissions.value, selectedPermissions.value))
const menuDiff = computed(() => diffSets(baseMenus.value, selectedMenus.value))
const counts = computed(() => countChanges(permissionDiff.value, menuDiff.value))
const summary = computed(() => summarizeChanges(counts.value))
const hasChanges = computed(() => counts.value.added + counts.value.removed > 0)

function isChecked(code: string): boolean {
  return readonly.value || selectedPermissions.value.has(code)
}

function rowState(code: string): 'added' | 'removed' | '' {
  if (permissionDiff.value.added.includes(code)) {
    return 'added'
  }
  return permissionDiff.value.removed.includes(code) ? 'removed' : ''
}

function toggle(target: Set<string>, key: string, on: boolean): Set<string> {
  const next = new Set(target)
  if (on) {
    next.add(key)
  } else {
    next.delete(key)
  }
  return next
}

function onPermission(code: string, event: Event): void {
  selectedPermissions.value = toggle(
    selectedPermissions.value,
    code,
    (event.target as HTMLInputElement).checked,
  )
}

function onMenu(key: string): void {
  selectedMenus.value = toggle(selectedMenus.value, key, !selectedMenus.value.has(key))
}

function iconFor(menu: CatalogMenu) {
  return (menu.icon && MENU_ICONS[menu.icon]) || MENU_ICON_FALLBACK
}

function cancel(): void {
  selectedPermissions.value = new Set(basePermissions.value)
  selectedMenus.value = new Set(baseMenus.value)
  saveError.value = ''
}

// PUT mengganti seluruh set, jadi yang dikirim selalu set lengkap hasil pilihan, dan hanya
// untuk bagian yang berubah. Bagian yang sudah tersimpan tidak diulang bila yang lain gagal.
async function save(): Promise<void> {
  if (!hasChanges.value || saving.value || readonly.value) {
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    if (permissionDiff.value.added.length + permissionDiff.value.removed.length > 0) {
      const saved = await setRolePermissions(roleId.value, [...selectedPermissions.value])
      basePermissions.value = new Set(saved.permissions)
      selectedPermissions.value = new Set(saved.permissions)
    }
    if (menuDiff.value.added.length + menuDiff.value.removed.length > 0) {
      const saved = await setRoleMenus(roleId.value, [...selectedMenus.value])
      baseMenus.value = new Set(saved.menus)
      selectedMenus.value = new Set(saved.menus)
    }
    toast.success('Izin dan menu disimpan')
  } catch (error) {
    saveError.value = describeError(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppShellLayout>
    <div class="nk-page">
      <div
        v-if="state.status.value === 'loading' || state.status.value === 'idle'"
        data-testid="access-loading"
        aria-busy="true"
      >
        <p class="nk-visually-hidden" role="status">Memuat izin dan menu…</p>
        <div class="nk-skeleton nk-table-skeleton" aria-hidden="true"></div>
      </div>

      <EmptyState
        v-else-if="state.status.value === 'forbidden'"
        title="Kamu tidak punya akses"
        message="Halaman ini hanya untuk SuperAdmin."
      />

      <EmptyState
        v-else-if="state.status.value === 'not-found'"
        title="Role tidak ditemukan"
        message="Role ini mungkin sudah dihapus."
      >
        <RouterLink
          class="nk-appbtn nk-appbtn--primary nk-appbtn--sm"
          :to="{ name: 'admin-roles' }"
        >
          Kembali ke daftar role
        </RouterLink>
      </EmptyState>

      <ErrorState
        v-else-if="state.status.value === 'error' || !role"
        title="Izin dan menu belum bisa dimuat"
        @retry="state.load"
      />

      <template v-else>
        <RouterLink class="nk-backlink" :to="{ name: 'admin-roles' }">
          <NkIcon name="chevron-left" :size="16" />Role
        </RouterLink>
        <header class="nk-page__head">
          <div>
            <h1 class="nk-page__title">
              {{ role.name }}
              <StatusBadge
                :tone="system ? 'brand' : 'info'"
                :label="system ? 'Sistem' : 'Kustom'"
              />
            </h1>
            <p class="nk-page__lead">
              {{ role.description ?? 'Tanpa deskripsi' }}
              <template v-if="readonly"> · hanya mode lihat</template>
            </p>
          </div>
          <div v-if="!readonly" class="nk-savebar">
            <p v-if="summary" class="nk-savebar__summary" role="status">
              <NkIcon name="edit-3" :size="14" />{{ summary }}
            </p>
            <button
              type="button"
              class="nk-appbtn nk-appbtn--outline"
              :disabled="!hasChanges || saving"
              @click="cancel"
            >
              Batalkan
            </button>
            <button
              type="button"
              class="nk-appbtn nk-appbtn--primary"
              :disabled="!hasChanges || saving"
              @click="save"
            >
              {{ saving ? 'Menyimpan…' : 'Simpan perubahan' }}
              <NkIcon v-if="!saving" name="check" :size="16" />
            </button>
          </div>
        </header>

        <p v-if="saveError" class="nk-form__error" role="alert">{{ saveError }}</p>
        <p v-if="readonly" class="nk-note nk-note--warning">
          <NkIcon name="lock" :size="16" />SuperAdmin lolos semua izin lewat kode, jadi daftar izin
          hanya informasi dan tidak bisa diubah.
        </p>

        <div class="nk-access">
          <section class="nk-card" aria-labelledby="izin-title">
            <header class="nk-card__head">
              <h2 id="izin-title" class="nk-card__title">Izin</h2>
              <span class="nk-card__meta">
                {{ readonly ? state.data.value?.permissions.length : selectedPermissions.size }}
                dari {{ state.data.value?.permissions.length }} dipilih
              </span>
            </header>
            <fieldset v-for="group in permissionGroups" :key="group.key" class="nk-access__group">
              <legend class="nk-access__legend">{{ group.title }}</legend>
              <label
                v-for="permission in group.items"
                :key="permission.code"
                class="nk-access__row"
                :class="rowState(permission.code) && `is-${rowState(permission.code)}`"
              >
                <input
                  type="checkbox"
                  class="nk-check"
                  :checked="isChecked(permission.code)"
                  :disabled="readonly || saving"
                  @change="onPermission(permission.code, $event)"
                />
                <span class="nk-access__text">
                  <code>{{ permission.code }}</code>
                  <small>{{ permission.description }}</small>
                </span>
                <span v-if="rowState(permission.code) === 'added'" class="nk-access__flag is-added">
                  Ditambah
                </span>
                <span
                  v-else-if="rowState(permission.code) === 'removed'"
                  class="nk-access__flag is-removed"
                >
                  Dicabut
                </span>
              </label>
            </fieldset>
          </section>

          <section class="nk-card" aria-labelledby="menu-title">
            <header class="nk-card__head">
              <h2 id="menu-title" class="nk-card__title">Menu sidebar</h2>
              <span class="nk-card__meta">
                {{ selectedMenus.size }} dari {{ state.data.value?.menus.length }} dipilih
              </span>
            </header>
            <div v-for="group in menuGroups" :key="group.key" class="nk-access__group">
              <p class="nk-access__legend">{{ group.title }}</p>
              <div
                v-for="menu in group.items"
                :key="menu.key"
                class="nk-access__row nk-access__row--menu"
              >
                <NkIcon :name="iconFor(menu)" :size="18" />
                <span :id="`menu-${menu.key}`" class="nk-access__label">{{ menu.label }}</span>
                <button
                  type="button"
                  class="nk-toggle"
                  role="switch"
                  :aria-checked="selectedMenus.has(menu.key)"
                  :aria-labelledby="`menu-${menu.key}`"
                  :disabled="readonly || saving"
                  @click="onMenu(menu.key)"
                ></button>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </AppShellLayout>
</template>
