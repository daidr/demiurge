<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'
import { cn } from '@/lib/utils'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)" :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }" v-bind="props"
  >
    <template #success-icon>
      <div class="i-mingcute-check-line text-4" />
    </template>
    <template #info-icon>
      <div class="i-mingcute-information-line text-4" />
    </template>
    <template #warning-icon>
      <div class="i-mingcute-safe-alert-line text-4" />
    </template>
    <template #error-icon>
      <div class="i-mingcute-alert-diamond-line text-4" />
    </template>
    <template #loading-icon>
      <div>
        <div class="i-mingcute-loading-3-line text-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <div class="i-mingcute-close-line text-4" />
    </template>
  </Sonner>
</template>
