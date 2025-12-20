<script setup lang="ts">
import type { ISunburstChartSpec } from '@visactor/vchart'
import type { JsonSizeNode } from '@/components/base/JsonTree'
import VChart from '@visactor/vchart'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  node: JsonSizeNode
  class?: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const chartInstance = shallowRef<VChart | null>(null)

function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Convert JsonSizeNode to VChart sunburst data format
function convertToSunburstData(node: JsonSizeNode): any {
  const result: any = {
    name: node.key,
    path: node.path,
    percentage: node.percentage,
    type: node.type,
    size: node.size,
  }

  if (node.children && node.children.length > 0) {
    result.children = node.children.map(convertToSunburstData)
  }
  else {
    result.value = node.size
  }

  return result
}

const colors = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E86452',
  '#6DC8EC',
  '#945FB9',
  '#FF9845',
  '#1E9493',
  '#FF99C3',
]

// Hash function to get consistent color index from path
function getColorIndex(path: string): number {
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % colors.length
}

const chartData = computed(() => {
  // Keep root node, return full tree structure
  return [convertToSunburstData(props.node)]
})

function createChart() {
  if (!containerRef.value)
    return

  if (chartInstance.value) {
    chartInstance.value.release()
    chartInstance.value = null
  }

  const spec = {
    type: 'sunburst',
    data: [
      {
        id: 'data',
        values: chartData.value,
      },
    ],
    categoryField: 'name',
    valueField: 'value',
    seriesField: 'path',
    gap: 1,
    drill: true,
    drillField: 'name',
    label: {
      visible: true,
      style: {
        fontSize: 12,
        fill: '#333',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    padding: 0,
    outerRadius: 1,
    labelAutoVisible: {
      enable: true,
      circumference: 5,
    },
    sunburst: {
      visible: true,
      style: {
        fill: (datum: any) => {
          const path = datum?.path || datum?.name || ''
          return colors[getColorIndex(path)]
        },
        // fillOpacity: (datum: any) => {
        //   return datum.isLeaf ? 0.6 : 1
        // },
        padAngle: 0,
        lineWidth: 0,
      },
    },
    tooltip: {
      mark: {
        title: {
          value: (data: any) => {
            const datum = data?.datum
            const current = Array.isArray(datum) ? datum[datum.length - 1] : datum
            // Use the stored full path, fallback to name for root
            return current?.path || current?.name || ''
          },
        },
        content: [
          {
            key: 'Size',
            value: (data: any) => {
              const datum = data?.datum
              const current = Array.isArray(datum) ? datum[datum.length - 1] : datum
              return current?.size ? formatSize(current.size) : ''
            },
          },
          {
            key: 'Percentage',
            value: (data: any) => {
              const datum = data?.datum
              const current = Array.isArray(datum) ? datum[datum.length - 1] : datum
              return current?.percentage ? `${current.percentage.toFixed(1)}%` : ''
            },
          },
          {
            key: 'Type',
            value: (data: any) => {
              const datum = data?.datum
              const current = Array.isArray(datum) ? datum[datum.length - 1] : datum
              return current?.type || ''
            },
          },
        ],
      },
    },
    animationEnter: {
      label: {
        type: 'fadeIn',
      },
      easing: 'cubicInOut',
      duration: 1000,
    },
    animationExit: {
      easing: 'cubicInOut',
      duration: 1000,
    },
    animationUpdate: {
      easing: 'cubicInOut',
      duration: 1000,
    },
  } satisfies ISunburstChartSpec

  chartInstance.value = new VChart(spec, { dom: containerRef.value })
  chartInstance.value.renderSync()
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.release()
    chartInstance.value = null
  }
})

watch(() => props.node, () => {
  createChart()
}, { deep: true })
</script>

<template>
  <div :class="cn('w-full h-full', props.class)">
    <div ref="containerRef" class="w-full h-full" />
  </div>
</template>
