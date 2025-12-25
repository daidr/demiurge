<script setup lang="ts">
import type { JsonPathSegment } from '@/utils/positionToJsonPath'
import { useClipboard, useElementSize, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  segments: JsonPathSegment[]
  jsonPath: string
}>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

const { t } = useI18n()
const { copy, copied } = useClipboard()

const hasPath = computed(() => props.segments.length > 0)

// Container and segment refs for measuring
const containerRef = ref<HTMLElement | null>(null)
const segmentsContainerRef = ref<HTMLElement | null>(null)

// Track which segments are collapsed
const collapseCount = ref(0)

// Measure and calculate collapsed segments
const { width: containerWidth } = useElementSize(containerRef)

async function recalculateCollapse() {
  await nextTick()

  if (!containerRef.value || !segmentsContainerRef.value) {
    collapseCount.value = 0
    return
  }

  // Get available width (container - copy button - root button - padding)
  const copyButtonWidth = 32 // w-6 + some margin
  const rootButtonWidth = 24 // $ button
  const ellipsisWidth = 40 // ... button width
  const padding = 24 // px-3 on both sides
  const availableWidth = containerWidth.value - copyButtonWidth - rootButtonWidth - padding

  if (availableWidth <= 0) {
    collapseCount.value = props.segments.length > 1 ? props.segments.length - 1 : 0
    return
  }

  // Measure each segment's width
  const segmentElements = segmentsContainerRef.value.querySelectorAll('[data-segment]')
  const widths: number[] = []

  segmentElements.forEach((el) => {
    widths.push((el as HTMLElement).offsetWidth + 12) // +12 for gap and separator
  })

  // Calculate how many segments we need to collapse
  let totalWidth = 0
  let visibleFromEnd = 0

  // Start from the end and count backwards
  for (let i = widths.length - 1; i >= 0; i--) {
    const segmentWidth = widths[i]!
    const needsEllipsis = visibleFromEnd < widths.length - 1

    if (totalWidth + segmentWidth + (needsEllipsis ? ellipsisWidth : 0) <= availableWidth) {
      totalWidth += segmentWidth
      visibleFromEnd++
    }
    else {
      break
    }
  }

  // If we can't fit even one segment, show at least the last one
  if (visibleFromEnd === 0) {
    visibleFromEnd = 1
  }

  collapseCount.value = Math.max(0, props.segments.length - visibleFromEnd)
}

// Watch for changes that require recalculation
watch([() => props.segments, containerWidth], recalculateCollapse, { immediate: true, deep: true })
useResizeObserver(containerRef, recalculateCollapse)

// Computed segments
const collapsedSegments = computed(() => props.segments.slice(0, collapseCount.value))
const visibleSegments = computed(() => props.segments.slice(collapseCount.value))

function handleCopy() {
  copy(props.jsonPath)
}

function handleNavigate(segment: JsonPathSegment) {
  emit('navigate', segment.path)
}

function handleNavigateRoot() {
  emit('navigate', '')
}
</script>

<template>
  <div
    ref="containerRef"
    class="h-[30px] flex items-center gap-0.5 px-3 border-b border-border bg-muted/30 text-xs overflow-hidden"
  >
    <!-- Hidden container for measuring all segments -->
    <div
      ref="segmentsContainerRef"
      class="absolute opacity-0 pointer-events-none flex items-center gap-0.5 whitespace-nowrap"
      aria-hidden="true"
    >
      <template v-for="(segment, index) in segments" :key="`measure-${index}`">
        <span class="shrink-0">
          <span class="i-mingcute-right-line w-3 h-3" />
        </span>
        <span
          data-segment
          class="shrink-0 px-1.5 py-0.5 max-w-[120px] truncate"
        >
          {{ segment.label }}
        </span>
      </template>
    </div>

    <!-- Root -->
    <button
      type="button"
      class="shrink-0 px-1.5 py-0.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
      @click="handleNavigateRoot"
    >
      $
    </button>

    <!-- Collapsed segments indicator -->
    <template v-if="collapseCount > 0">
      <span class="text-muted-foreground/50 shrink-0">
        <span class="i-mingcute-right-line w-3 h-3" />
      </span>
      <Popover>
        <PopoverTrigger as-child>
          <button
            type="button"
            class="shrink-0 px-1.5 py-0.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
          >
            ...
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          :side-offset="4"
          class="w-auto max-w-[300px] p-2"
        >
          <div class="flex flex-col gap-0.5">
            <button
              v-for="(segment, index) in collapsedSegments"
              :key="index"
              type="button"
              class="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-left hover:bg-accent hover:text-accent-foreground transition-colors"
              @click="handleNavigate(segment)"
            >
              <span class="text-muted-foreground/50 shrink-0">
                <span class="i-mingcute-right-line w-3 h-3" />
              </span>
              <span class="truncate">{{ segment.label }}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </template>

    <!-- Visible path segments -->
    <template v-for="(segment, index) in visibleSegments" :key="`visible-${index}`">
      <span class="text-muted-foreground/50 shrink-0">
        <span class="i-mingcute-right-line w-3 h-3" />
      </span>
      <button
        type="button"
        class="shrink-0 px-1.5 py-0.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors truncate max-w-[120px]"
        :class="index === visibleSegments.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'"
        :title="String(segment.key)"
        @click="handleNavigate(segment)"
      >
        {{ segment.label }}
      </button>
    </template>

    <!-- Spacer -->
    <div class="flex-1 min-w-0" />

    <!-- Copy button -->
    <Tooltip v-if="hasPath">
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 shrink-0"
          @click="handleCopy"
        >
          <span
            class="w-3.5 h-3.5 transition-all"
            :class="copied ? 'i-mingcute-check-line text-green-500' : 'i-mingcute-copy-2-line'"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{{ copied ? t('breadcrumb.copied') : t('breadcrumb.copy_path') }}</p>
        <p v-if="!copied" class="text-muted-foreground text-xs mt-0.5">
          {{ jsonPath }}
        </p>
      </TooltipContent>
    </Tooltip>
  </div>
</template>
