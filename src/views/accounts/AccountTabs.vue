<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="nk-tabs" aria-label="Bagian Pengguna & Role">
    <RouterLink class="nk-tabs__link" :to="{ name: 'admin-users' }" exact-active-class="is-active">
      Pengguna
    </RouterLink>
    <RouterLink class="nk-tabs__link" :to="{ name: 'admin-roles' }" exact-active-class="is-active">
      Role
    </RouterLink>
  </nav>
</template>
