<script setup lang="ts">
import { ref, useId } from 'vue'
import NkIcon from '@/components/NkIcon.vue'

export interface AccordionItem {
  id: string
  question: string
  answer: string
}

const props = defineProps<{
  items: AccordionItem[]
  /** ID item yang terbuka saat pertama dirender. */
  defaultOpenId?: string
}>()

const prefix = useId()
const openId = ref<string | null>(props.defaultOpenId ?? null)

function toggle(id: string): void {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div class="nk-accordion">
    <div v-for="item in props.items" :key="item.id" class="nk-accordion__item">
      <h3>
        <button
          :id="`${prefix}-${item.id}-btn`"
          type="button"
          class="nk-accordion__button"
          :aria-expanded="openId === item.id"
          :aria-controls="`${prefix}-${item.id}-panel`"
          @click="toggle(item.id)"
        >
          {{ item.question }}
          <NkIcon :name="openId === item.id ? 'minus' : 'plus'" :size="20" />
        </button>
      </h3>
      <div
        v-show="openId === item.id"
        :id="`${prefix}-${item.id}-panel`"
        class="nk-accordion__panel"
        role="region"
        :aria-labelledby="`${prefix}-${item.id}-btn`"
      >
        {{ item.answer }}
      </div>
    </div>
  </div>
</template>
