<script setup lang="ts">
import FeatherIcon from '@/components/FeatherIcon.vue'
import { usePermission } from '@/composables/usePermission'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { canManageUsers, canManageRoles } = usePermission()
</script>

<template>
  <VerticalLayout>
    <div class="row match-height">
      <div class="col-12 mb-2">
        <div class="card card-congratulations">
          <div class="card-body text-center p-3">
            <h1 class="card-title fw-bold text-white mb-1">Halo, {{ authStore.profile?.name }}!</h1>
            <p class="card-text text-white mb-0">
              Selamat datang di Panel Manajemen Canvas Wedding. Anda masuk sebagai
              <strong>{{ authStore.profile?.role.name }}</strong
              >.
            </p>
          </div>
        </div>
      </div>

      <div v-if="canManageUsers" class="col-md-6 col-12">
        <div class="card">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <h4 class="card-title fw-bold mb-50">Manajemen Pengguna</h4>
              <p class="card-text mb-1">Kelola data user, role, status aktif, dan kata sandi.</p>
              <RouterLink :to="{ name: 'users' }" class="btn btn-primary btn-sm">
                Buka Pengguna
              </RouterLink>
            </div>
            <div class="avatar bg-light-primary p-50 m-0">
              <div class="avatar-content">
                <FeatherIcon name="users" :size="28" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="canManageRoles" class="col-md-6 col-12">
        <div class="card">
          <div class="card-body d-flex align-items-center justify-content-between">
            <div>
              <h4 class="card-title fw-bold mb-50">Manajemen Role</h4>
              <p class="card-text mb-1">Kelola daftar hak peran sistem untuk pengguna.</p>
              <RouterLink :to="{ name: 'roles' }" class="btn btn-outline-primary btn-sm">
                Buka Role
              </RouterLink>
            </div>
            <div class="avatar bg-light-primary p-50 m-0">
              <div class="avatar-content">
                <FeatherIcon name="shield" :size="28" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </VerticalLayout>
</template>
