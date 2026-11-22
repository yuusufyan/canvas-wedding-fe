<script setup lang="ts" generic="T extends string">
export interface ChipOption<V extends string> {
  value: V | ''
  label: string
  count?: string
}

defineProps<{ options: ChipOption<T>[]; label: string }>()

// '' berarti semua.
const model = defineModel<T | ''>({ required: true })
</script>

<template>
  <div class="nk-chips" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="nk-chip"
      :class="{ 'is-active': model === option.value }"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
      <span v-if="option.count !== undefined" class="nk-chip__count">{{ option.count }}</span>
    </button>
  </div>
</template>
