<script setup lang="ts" generic="Row extends object">
import { BREAKPOINTS, useMinWidth } from '@/composables/useBreakpoint'

export interface TableColumn {
  key: string
  label: string
  /** Peran kolom pada kartu (< 768): nama, status, keterangan, atau aksi. */
  role: 'primary' | 'status' | 'meta' | 'action'
}

const props = defineProps<{
  columns: TableColumn[]
  rows: Row[]
  rowKey: (row: Row) => string
  caption: string
}>()

// Satu pola untuk semua tabel: tabel penuh >= 768, daftar kartu di bawahnya. Hanya satu
// cabang yang dirender agar penanda tes dan pembaca layar tidak ganda.
const isTable = useMinWidth(BREAKPOINTS.md)

function pick(role: TableColumn['role']): TableColumn[] {
  return props.columns.filter((col) => col.role === role)
}

function fallback(row: Row, key: string): string {
  return String((row as Record<string, unknown>)[key] ?? '')
}
</script>

<template>
  <div v-if="isTable" class="nk-table-wrap">
    <table class="nk-table">
      <caption class="nk-visually-hidden">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col">
            <span :class="{ 'nk-visually-hidden': col.role === 'action' }">{{ col.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="rowKey(row)">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row">{{ fallback(row, col.key) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <ul v-else class="nk-cards" :aria-label="caption">
    <li v-for="row in rows" :key="rowKey(row)" class="nk-rowcard">
      <div class="nk-rowcard__head">
        <div class="nk-rowcard__main">
          <slot v-for="col in pick('primary')" :key="col.key" :name="`cell-${col.key}`" :row="row">
            {{ fallback(row, col.key) }}
          </slot>
        </div>
        <div class="nk-rowcard__side">
          <slot v-for="col in pick('status')" :key="col.key" :name="`cell-${col.key}`" :row="row">
            {{ fallback(row, col.key) }}
          </slot>
          <slot v-for="col in pick('action')" :key="col.key" :name="`cell-${col.key}`" :row="row" />
        </div>
      </div>
      <dl v-if="pick('meta').length" class="nk-rowcard__meta">
        <div v-for="col in pick('meta')" :key="col.key">
          <dt>{{ col.label }}</dt>
          <dd>
            <slot :name="`cell-${col.key}`" :row="row">{{ fallback(row, col.key) }}</slot>
          </dd>
        </div>
      </dl>
    </li>
  </ul>
</template>
