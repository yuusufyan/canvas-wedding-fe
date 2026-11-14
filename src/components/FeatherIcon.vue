<script setup lang="ts">
import { computed } from 'vue'
import feather from 'feather-icons'

type FeatherIconName = keyof typeof feather.icons

const props = withDefaults(
  defineProps<{
    name: FeatherIconName
    size?: number
    /** Accessible name; omit for icons that sit next to visible text. */
    label?: string
  }>(),
  { size: 14, label: undefined },
)

// Rendered with v-html: the markup comes from the bundled feather-icons package, never from user data.
const svg = computed(() =>
  feather.icons[props.name].toSvg({ width: props.size, height: props.size }),
)
</script>

<template>
  <span
    class="d-inline-flex"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    v-html="svg"
  ></span>
</template>
