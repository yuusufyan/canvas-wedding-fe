<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AccessBadge from '@/components/AccessBadge.vue'
import InvitationRenderer from '@/components/InvitationRenderer.vue'
import NkIcon from '@/components/NkIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { TEMPLATE_STATUS_TONE } from '@/constants/admin'
import type { AdminTemplate } from '@/types/admin'
import { formatRelativeTime } from '@/utils/relative-time'
import TemplateActionMenu, { type TemplateAction } from './TemplateActionMenu.vue'

const props = defineProps<{ template: AdminTemplate; busy?: boolean }>()
const emit = defineEmits<{ action: [action: TemplateAction] }>()
</script>

<template>
  <article class="nk-tcard2" :aria-busy="props.busy">
    <div class="nk-tcard2__media" :style="{ background: props.template.cover.background }">
      <span class="nk-tcard2__tag"><AccessBadge :access="props.template.access" /></span>
      <InvitationRenderer :page="props.template.cover" decorative />
      <div class="nk-tcard2__hover">
        <RouterLink
          class="nk-appbtn nk-appbtn--primary nk-appbtn--sm"
          :to="{ name: 'admin-template-editor', params: { id: props.template.id } }"
        >
          <NkIcon name="edit-3" :size="16" />Edit di Canvas
        </RouterLink>
        <RouterLink
          class="nk-appbtn nk-appbtn--light nk-appbtn--sm"
          :to="{ name: 'demo', params: { slug: props.template.slug } }"
        >
          <NkIcon name="eye" :size="16" />Pratinjau
        </RouterLink>
      </div>
    </div>
    <div class="nk-tcard2__body">
      <div class="nk-tcard2__row">
        <h3 class="nk-tcard2__name">{{ props.template.name }}</h3>
        <TemplateActionMenu
          :template="props.template"
          :disabled="props.busy"
          @action="(a) => emit('action', a)"
        />
      </div>
      <div class="nk-tcard2__row">
        <StatusBadge
          :tone="TEMPLATE_STATUS_TONE[props.template.status]"
          :label="props.template.status"
        />
        <span class="nk-tcard2__meta">
          {{ props.template.page_count }} halaman &middot;
          {{ formatRelativeTime(props.template.updated_at) }}
        </span>
      </div>
    </div>
  </article>
</template>
