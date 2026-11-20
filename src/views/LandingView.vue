<script setup lang="ts">
import PublicLayout from '@/layouts/PublicLayout.vue'
import EditorShowcase from './landing/EditorShowcase.vue'
import FaqSection from './landing/FaqSection.vue'
import FinalCta from './landing/FinalCta.vue'
import HeroSection from './landing/HeroSection.vue'
import HowItWorks from './landing/HowItWorks.vue'
import PricingSection from './landing/PricingSection.vue'
import StatsBand from './landing/StatsBand.vue'
import TemplateGallery from './landing/TemplateGallery.vue'
</script>

<template>
  <PublicLayout>
    <HeroSection />
    <StatsBand />
    <HowItWorks />
    <EditorShowcase />
    <TemplateGallery />
    <PricingSection />
    <FaqSection />
    <FinalCta />
  </PublicLayout>
</template>
