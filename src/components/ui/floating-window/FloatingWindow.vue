<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/stores/layout'

const props = withDefaults(defineProps<{
  title?: string
  modelValue?: boolean
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
  class?: string
}>(), {
  title: '',
  modelValue: false,
  initialWidth: 500,
  initialHeight: 400,
  minWidth: 300,
  minHeight: 200,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const layoutStore = useLayoutStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

// Window position and size
const windowRef = ref<HTMLDivElement | null>(null)
const position = ref({ x: 0, y: 0 })
const size = ref({ width: props.initialWidth, height: props.initialHeight })

// Dragging state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const positionStart = ref({ x: 0, y: 0 })

// Resizing state
const isResizing = ref(false)
const resizeDirection = ref<string>('')
const resizeStart = ref({ x: 0, y: 0 })
const sizeStart = ref({ width: 0, height: 0 })
const positionStartResize = ref({ x: 0, y: 0 })

// Center the window on mount
function centerWindow() {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  position.value = {
    x: Math.max(0, (viewportWidth - size.value.width) / 2),
    y: Math.max(0, (viewportHeight - size.value.height) / 2),
  }
}

// Dragging handlers
function onDragStart(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.floating-window-close'))
    return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  positionStart.value = { ...position.value }
  e.preventDefault()
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value)
    return
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - size.value.width, positionStart.value.x + deltaX)),
    y: Math.max(0, Math.min(window.innerHeight - size.value.height, positionStart.value.y + deltaY)),
  }
}

function onDragEnd() {
  isDragging.value = false
}

// Resizing handlers
function onResizeStart(e: MouseEvent, direction: string) {
  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = { x: e.clientX, y: e.clientY }
  sizeStart.value = { ...size.value }
  positionStartResize.value = { ...position.value }
  e.preventDefault()
  e.stopPropagation()
}

function onResizeMove(e: MouseEvent) {
  if (!isResizing.value)
    return

  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y
  const dir = resizeDirection.value

  let newWidth = sizeStart.value.width
  let newHeight = sizeStart.value.height
  let newX = positionStartResize.value.x
  let newY = positionStartResize.value.y

  // Handle horizontal resize
  if (dir.includes('e')) {
    newWidth = Math.max(props.minWidth, sizeStart.value.width + deltaX)
  }
  if (dir.includes('w')) {
    const potentialWidth = sizeStart.value.width - deltaX
    if (potentialWidth >= props.minWidth) {
      newWidth = potentialWidth
      newX = positionStartResize.value.x + deltaX
    }
  }

  // Handle vertical resize
  if (dir.includes('s')) {
    newHeight = Math.max(props.minHeight, sizeStart.value.height + deltaY)
  }
  if (dir.includes('n')) {
    const potentialHeight = sizeStart.value.height - deltaY
    if (potentialHeight >= props.minHeight) {
      newHeight = potentialHeight
      newY = positionStartResize.value.y + deltaY
    }
  }

  // Constrain to viewport
  newX = Math.max(0, newX)
  newY = Math.max(0, newY)
  newWidth = Math.min(newWidth, window.innerWidth - newX)
  newHeight = Math.min(newHeight, window.innerHeight - newY)

  size.value = { width: newWidth, height: newHeight }
  position.value = { x: newX, y: newY }
}

function onResizeEnd() {
  isResizing.value = false
  resizeDirection.value = ''
}

function onMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    onDragMove(e)
  }
  else if (isResizing.value) {
    onResizeMove(e)
  }
}

function onMouseUp() {
  if (isDragging.value) {
    onDragEnd()
  }
  if (isResizing.value) {
    onResizeEnd()
  }
}

function close() {
  isOpen.value = false
}

// Watch for open changes to center window
watch(isOpen, (newVal, oldVal) => {
  if (newVal) {
    centerWindow()
    layoutStore.incrementDialogCount()
  }
  else if (oldVal) {
    layoutStore.decrementDialogCount()
  }
})

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (isOpen.value) {
    centerWindow()
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  // Decrement dialog count if window was open when unmounted
  if (isOpen.value) {
    layoutStore.decrementDialogCount()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close" />

        <!-- Window -->
        <div
          ref="windowRef"
          :class="cn(
            'absolute left-0 top-0 bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden',
            (isDragging || isResizing) && 'select-none',
            props.class,
          )"
          :style="{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            willChange: (isDragging || isResizing) ? 'transform' : 'auto',
          }"
        >
          <!-- Title bar -->
          <div class="flex-shrink-0">
            <div
              class="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50 cursor-move"
              @mousedown="onDragStart"
            >
              <span class="text-sm font-medium select-none">{{ title }}</span>
              <div v-if="$slots.header" class="flex items-center" @mousedown.stop>
                <slot name="header" />
              </div>
              <div class="flex-1" />
              <button
                class="floating-window-close w-6 h-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                @click="close"
              >
                <span class="i-mingcute-close-line text-sm" />
              </button>
            </div>
            <!-- Toolbar (second header row) -->
            <div v-if="$slots.toolbar" class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
              <slot name="toolbar" />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-h-0 overflow-hidden">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex-shrink-0 flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-muted/30">
            <slot name="footer" />
          </div>

          <!-- Resize handles -->
          <!-- Edges -->
          <div
            class="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
            @mousedown="(e) => onResizeStart(e, 'n')"
          />
          <div
            class="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            @mousedown="(e) => onResizeStart(e, 's')"
          />
          <div
            class="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
            @mousedown="(e) => onResizeStart(e, 'w')"
          />
          <div
            class="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
            @mousedown="(e) => onResizeStart(e, 'e')"
          />

          <!-- Corners -->
          <div
            class="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
            @mousedown="(e) => onResizeStart(e, 'nw')"
          />
          <div
            class="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
            @mousedown="(e) => onResizeStart(e, 'ne')"
          />
          <div
            class="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
            @mousedown="(e) => onResizeStart(e, 'sw')"
          />
          <div
            class="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize"
            @mousedown="(e) => onResizeStart(e, 'se')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
