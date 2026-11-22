<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppDialog from '@/components/AppDialog.vue'
import NkIcon from '@/components/NkIcon.vue'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'
import { formatNumber } from '@/utils/relative-time'

defineProps<{
  open: boolean
  role: Role | null
  /** Pengguna dengan role ini yang ditemukan (hingga 100 pengguna pertama). */
  users: User[]
  /** True bila daftar pengguna belum lengkap (lebih dari 100 pengguna). */
  partial: boolean
  loading: boolean
}>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <AppDialog
    :open="open"
    :title="`Role ${role?.name ?? ''} belum bisa dihapus`"
    description="Role ini masih dipakai pengguna. Pindahkan mereka ke role lain dulu, baru role bisa dihapus."
    size="sm"
    @close="emit('close')"
  >
    <template #icon>
      <span class="nk-modal__icon nk-modal__icon--warning">
        <NkIcon name="alert-triangle" :size="22" />
      </span>
    </template>

    <p v-if="loading" class="nk-note" role="status">Memuat pengguna…</p>
    <template v-else>
      <ul v-if="users.length" class="nk-userlist" aria-label="Pengguna dengan role ini">
        <li v-for="user in users" :key="user.id" class="nk-person">
          <span class="nk-person__avatar" aria-hidden="true">
            {{ user.name.trim().charAt(0).toUpperCase() }}
          </span>
          <span class="nk-person__text">
            <strong>{{ user.name }}</strong>
            <small>{{ user.email }}</small>
          </span>
        </li>
      </ul>
      <p v-else class="nk-note">
        <NkIcon name="info" :size="16" />Daftar pengguna belum bisa ditampilkan.
      </p>
      <p v-if="partial && users.length" class="nk-field__hint">
        Menampilkan pengguna dari {{ formatNumber(100) }} akun pertama; mungkin masih ada yang lain.
      </p>
    </template>

    <div class="nk-modal__actions">
      <button type="button" class="nk-appbtn nk-appbtn--outline" @click="emit('close')">
        Tutup
      </button>
      <RouterLink class="nk-appbtn nk-appbtn--primary" :to="{ name: 'admin-users' }">
        Lihat pengguna<NkIcon name="users" :size="16" />
      </RouterLink>
    </div>
  </AppDialog>
</template>
