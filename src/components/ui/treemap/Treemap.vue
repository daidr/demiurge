<script setup lang="ts">
import type { ITreemapChartSpec } from '@visactor/vchart'
import type { JsonSizeNode } from '@/components/base/JsonTree'
import VChart from '@visactor/vchart'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  node: JsonSizeNode
  class?: string
}>()

const emit = defineEmits<{
  nodeClick: [path: string, event: MouseEvent]
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

// Convert JsonSizeNode to VChart treemap data format
function convertToTreemapData(node: JsonSizeNode): any {
  const result: any = {
    name: node.path,
    path: node.path,
    percentage: node.percentage,
    type: node.type,
    size: node.size, // Keep size for tooltip display
  }

  if (node.children && node.children.length > 0) {
    // For non-leaf nodes, don't set value - VChart will calculate from children
    result.children = node.children.map(convertToTreemapData)
  }
  else {
    // Only leaf nodes should have value for correct sizing
    result.value = node.size
  }

  return result
}

const chartData = computed(() => {
  const rootData = convertToTreemapData(props.node)
  // If root has children, use them as top-level data for better color distribution
  // Each top-level child will get a different color
  if (rootData.children && rootData.children.length > 0) {
    return rootData.children
  }
  // If no children, return root as single item
  return [rootData]
})

function createChart() {
  if (!containerRef.value)
    return

  // Dispose existing chart
  if (chartInstance.value) {
    chartInstance.value.release()
    chartInstance.value = null
  }

  const spec = {
    type: 'treemap',
    data: [
      {
        id: 'data',
        values: chartData.value,
      },
    ],
    categoryField: 'name',
    valueField: 'value',
    aspectRatio: 1,
    drill: true,
    drillField: 'name',
    roam: true,
    // Gap between nodes to show hierarchy
    gapWidth: [8, 4, 2, 1],
    nodePadding: [4, 4, 4, 4],
    // Labels for leaf nodes
    label: {
      visible: true,
      style: {
        fontSize: 11,
        fill: '#fff',
        textBaseline: 'middle',
        textAlign: 'center',
      },
      formatMethod: (text: string | string[], datum: any) => {
        if (datum?.percentage) {
          return `${text}\n${datum.percentage.toFixed(1)}%`
        }
        return text
      },
    },
    nonLeaf: {
      visible: true,
    },
    color: {
      type: 'ordinal',
      domain: [],
      range: [
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
      ],
    },
    // Non-leaf (parent) nodes configuration
    nonLeafLabel: {
      visible: true,
      position: 'top',
      padding: 15,
      style: {
        x: (data: any) => {
          // Label will be placed at the center of node rect.
          // Here we adjust the x attribute to position label to the left
          // 默认标签显示在矩形中心位置，这里配置为左对齐，预留 4px 间距
          return data.labelRect?.x0 + 4
        },
        textAlign: 'left',
        // string array will be shown like multi-line text
        // 字符串数组将会以多行文本的形式展示
        text: (data: any) => [data.name],
      },
    },
    tooltip: {
      mark: {
        title: {
          value: (data: any) => {
            // datum property in treemap data shows all the data of nodes from root to current node
            // Use the stored full path for accurate display
            // 使用存储的完整路径来显示
            const current = Array.isArray(data?.datum) ? data.datum[data.datum.length - 1] : data?.datum
            return current?.path || current?.name || ''
          },
        },
        content: [
          {
            key: 'Size',
            value: (data: any) => {
              // datum is an array in treemap, get the last element for current node
              const current = Array.isArray(data?.datum) ? data.datum[data.datum.length - 1] : data?.datum
              // Use size field (available for all nodes) instead of value (only leaf nodes)
              return current?.size ? formatSize(current.size) : ''
            },
          },
          {
            key: 'Percentage',
            value: (data: any) => {
              const current = Array.isArray(data?.datum) ? data.datum[data.datum.length - 1] : data?.datum
              return current?.percentage ? `${current.percentage.toFixed(1)}%` : ''
            },
          },
          {
            key: 'Type',
            value: (data: any) => {
              const current = Array.isArray(data?.datum) ? data.datum[data.datum.length - 1] : data?.datum
              return current?.type || ''
            },
          },
        ],
      },
    },
  } satisfies ITreemapChartSpec

  chartInstance.value = new VChart(spec as any, { dom: containerRef.value })
  chartInstance.value.renderSync()

  // Add click event listener for Alt+Click navigation
  chartInstance.value.on('pointerdown', {
    level: 'mark',
    consume: true,
    filter(params) {
      return params.event?.altKey
    },
  }, (params: any) => {
    const datum = Array.isArray(params.datum)
      ? params.datum[params.datum.length - 1]
      : params.datum
    // Get the native event from VChart event object
    const nativeEvent = params.event?.nativeEvent as MouseEvent | undefined
    if (datum?.path !== undefined && nativeEvent) {
      emit('nodeClick', datum.path, nativeEvent)
    }
  })
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
