<script setup lang="ts">
import { computed } from 'vue'
import { STRENGTH_TEXT, passwordStrength } from '@/utils/password'

const props = defineProps<{ value: string }>()

const level = computed(() => passwordStrength(props.value))
const tone = computed(() => (level.value >= 3 ? 'strong' : 'weak'))
</script>

<template>
  <div v-if="level > 0" class="nk-strength" data-testid="password-strength">
    <div class="nk-strength__bars" aria-hidden="true">
      <span
        v-for="n in 4"
        :key="n"
        class="nk-strength__bar"
        :class="n <= level ? `is-on is-${tone}` : ''"
      ></span>
    </div>
    <p class="nk-strength__text">
      <span class="nk-visually-hidden">Kekuatan kata sandi: </span>{{ STRENGTH_TEXT[level] }}
    </p>
  </div>
</template>
