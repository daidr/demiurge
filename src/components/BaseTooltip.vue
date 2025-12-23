<script setup lang="ts">
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

defineProps<{
  text: string
}>()
</script>

<template>
  <Tooltip>
    <TooltipTrigger><slot /></TooltipTrigger>
    <TooltipContent>
      <div class="flex items-center gap-2">
        <span>{{ text }}</span>
        <slot name="kbd" />
      </div>
    </TooltipContent>
  </Tooltip>
</template>
