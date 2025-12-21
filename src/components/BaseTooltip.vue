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
      <p>{{ text }}</p>
    </TooltipContent>
  </Tooltip>
</template>
