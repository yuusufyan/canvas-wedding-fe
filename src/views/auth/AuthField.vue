<script setup lang="ts">
import { ref, useId } from 'vue'
import NkIcon from '@/components/NkIcon.vue'

const props = withDefaults(
  defineProps<{
    label: string
    id?: string
    type?: 'text' | 'email' | 'password'
    autocomplete?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    /** Tampilkan tombol tampilkan/sembunyikan untuk kolom kata sandi. */
    revealable?: boolean
    maxlength?: number
  }>(),
  {
    id: undefined,
    type: 'text',
    autocomplete: undefined,
    placeholder: undefined,
    error: '',
    disabled: false,
    revealable: false,
    maxlength: undefined,
  },
)

const model = defineModel<string>({ required: true })

const generatedId = useId()
const inputId = props.id ?? generatedId
const errorId = `${inputId}-error`
const input = ref<HTMLInputElement | null>(null)
const revealed = ref(false)

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="nk-authfield">
    <label class="nk-authfield__label" :for="inputId">{{ props.label }}</label>
    <div class="nk-authfield__control">
      <input
        :id="inputId"
        ref="input"
        v-model="model"
        class="nk-authfield__input"
        :class="{ 'has-toggle': props.revealable, 'is-invalid': props.error }"
        :type="props.revealable && revealed ? 'text' : props.type"
        :autocomplete="props.autocomplete"
        :placeholder="props.placeholder"
        :maxlength="props.maxlength"
        :disabled="props.disabled"
        :aria-invalid="props.error ? 'true' : undefined"
        :aria-describedby="props.error ? errorId : undefined"
        autocapitalize="none"
        spellcheck="false"
      />
      <button
        v-if="props.revealable"
        type="button"
        class="nk-authfield__toggle"
        :aria-label="revealed ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
        :disabled="props.disabled"
        @click="revealed = !revealed"
      >
        <NkIcon :name="revealed ? 'eye-off' : 'eye'" :size="20" />
      </button>
    </div>
    <div aria-live="polite">
      <p v-if="props.error" :id="errorId" class="nk-authfield__error">
        <NkIcon name="alert-circle" :size="14" />{{ props.error }}
      </p>
    </div>
    <slot />
  </div>
</template>
