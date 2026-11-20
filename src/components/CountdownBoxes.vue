<script setup lang="ts">
import { computed } from 'vue'
import { useCountdown } from '@/composables/useCountdown'

const props = defineProps<{ target: string }>()

const { days, hours, minutes, seconds } = useCountdown(() => props.target)

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const boxes = computed(() => [
  { label: 'Hari', value: pad(days.value) },
  { label: 'Jam', value: pad(hours.value) },
  { label: 'Menit', value: pad(minutes.value) },
  { label: 'Detik', value: pad(seconds.value) },
])
</script>

<template>
  <div>
    <div v-for="box in boxes" :key="box.label" class="nk-cd">
      <b>{{ box.value }}</b>
      <span>{{ box.label }}</span>
    </div>
  </div>
</template>
