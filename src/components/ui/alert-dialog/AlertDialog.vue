<script setup lang="ts">
import type { AlertDialogEmits, AlertDialogProps } from 'reka-ui'
import { AlertDialogRoot, useForwardPropsEmits } from 'reka-ui'
import { onUnmounted, ref, watch } from 'vue'
import { useLayoutStore } from '@/stores/layout'

const props = defineProps<AlertDialogProps>()
const emits = defineEmits<AlertDialogEmits>()

const forwarded = useForwardPropsEmits(props, emits)
const layoutStore = useLayoutStore()

// Track whether this dialog instance has been counted as open
const isCounted = ref(false)

// Track dialog open state
watch(() => props.open, (isOpen) => {
  if (isOpen && !isCounted.value) {
    layoutStore.incrementDialogCount()
    isCounted.value = true
  }
  else if (!isOpen && isCounted.value) {
    layoutStore.decrementDialogCount()
    isCounted.value = false
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (isCounted.value) {
    layoutStore.decrementDialogCount()
  }
})
</script>

<template>
  <AlertDialogRoot v-slot="slotProps" data-slot="alert-dialog" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </AlertDialogRoot>
</template>
