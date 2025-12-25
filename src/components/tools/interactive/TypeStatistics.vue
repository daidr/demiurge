<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'

const { t } = useI18n()
const toolsStore = useToolsStore()
const { typeStats, isCalculatingTypeStats } = storeToRefs(toolsStore)

// Format number with thousand separators
function formatNumber(n: number): string {
  return n.toLocaleString()
}

// Format decimal to 1 decimal place
function formatDecimal(n: number): string {
  return n.toFixed(1)
}

// Type distribution for chart-like display
const typeDistribution = computed(() => {
  if (!typeStats.value)
    return []

  const { types, totalNodes } = typeStats.value
  const items = [
    { type: 'object', count: types.object, color: 'bg-blue-500' },
    { type: 'array', count: types.array, color: 'bg-purple-500' },
    { type: 'string', count: types.string, color: 'bg-green-500' },
    { type: 'number', count: types.number, color: 'bg-yellow-500' },
    { type: 'boolean', count: types.boolean, color: 'bg-orange-500' },
    { type: 'null', count: types.null, color: 'bg-gray-500' },
  ]

  return items
    .filter(item => item.count > 0)
    .map(item => ({
      ...item,
      percentage: totalNodes > 0 ? (item.count / totalNodes) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
})

// Duplicate keys as sorted array
const duplicateKeys = computed(() => {
  if (!typeStats.value)
    return []

  const dups = typeStats.value.keys.duplicates as Record<string, number>
  return Object.entries(dups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Show top 10
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Content -->
    <div class="flex-grow overflow-auto min-h-0">
      <!-- Loading state -->
      <div v-if="isCalculatingTypeStats" class="flex items-center justify-center h-full text-muted-foreground">
        <span class="i-mingcute-loading-3-fill animate-spin text-2xl" />
      </div>

      <!-- No data state -->
      <div v-else-if="!typeStats" class="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div class="text-center flex flex-col items-center justify-center">
          <span class="i-mingcute-file-unknown-line text-3xl mb-2 block opacity-50" />
          <p>{{ t('tools.no_valid_json') }}</p>
        </div>
      </div>

      <!-- Statistics content -->
      <div v-else class="space-y-4 text-sm">
        <!-- Overview -->
        <section>
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.overview') }}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.totalNodes) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.total_nodes') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ typeStats.maxDepth }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.max_depth') }}
              </div>
            </div>
          </div>
        </section>

        <!-- Type Distribution -->
        <section>
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.type_distribution') }}
          </h3>
          <div class="space-y-1.5">
            <div
              v-for="item in typeDistribution"
              :key="item.type"
              class="flex items-center gap-2"
            >
              <div class="w-16 text-xs text-muted-foreground">
                {{ item.type }}
              </div>
              <div class="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div
                  :class="item.color"
                  class="h-full transition-all duration-300"
                  :style="{ width: `${item.percentage}%` }"
                />
              </div>
              <div class="w-20 text-xs text-right tabular-nums">
                {{ formatNumber(item.count) }} ({{ formatDecimal(item.percentage) }}%)
              </div>
            </div>
          </div>
        </section>

        <!-- Keys Statistics -->
        <section>
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.keys') }}
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.keys.total) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.total_keys') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.keys.unique) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.unique_keys') }}
              </div>
            </div>
          </div>
          <!-- Duplicate keys -->
          <div v-if="duplicateKeys.length > 0" class="mt-2">
            <div class="text-xs text-muted-foreground mb-1">
              {{ t('type_stats.repeated_keys') }}
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="[key, count] in duplicateKeys"
                :key="key"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded text-xs"
              >
                <span class="font-mono truncate max-w-[100px]">{{ key }}</span>
                <span class="text-muted-foreground">×{{ count }}</span>
              </span>
            </div>
          </div>
        </section>

        <!-- Arrays Statistics -->
        <section v-if="typeStats.arrays.count > 0">
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.arrays') }}
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.arrays.count) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.count') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.arrays.maxLength) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.max_length') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatDecimal(typeStats.arrays.avgLength) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.avg_length') }}
              </div>
            </div>
          </div>
        </section>

        <!-- Strings Statistics -->
        <section v-if="typeStats.strings.count > 0">
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.strings') }}
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.strings.count) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.count') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.strings.maxLength) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.max_length') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatDecimal(typeStats.strings.avgLength) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.avg_length') }}
              </div>
            </div>
          </div>
          <div v-if="typeStats.strings.emptyCount > 0" class="mt-2 text-xs text-muted-foreground">
            {{ t('type_stats.empty_strings', { count: typeStats.strings.emptyCount }) }}
          </div>
        </section>

        <!-- Numbers Statistics -->
        <section v-if="typeStats.numbers.count > 0">
          <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {{ t('type_stats.numbers') }}
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold">
                {{ formatNumber(typeStats.numbers.count) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.count') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold tabular-nums">
                {{ typeStats.numbers.min ?? '-' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.min') }}
              </div>
            </div>
            <div class="bg-muted/50 rounded-md p-2">
              <div class="text-lg font-semibold tabular-nums">
                {{ typeStats.numbers.max ?? '-' }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ t('type_stats.max') }}
              </div>
            </div>
          </div>
          <div class="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span v-if="typeStats.numbers.hasFloat" class="flex items-center gap-1">
              <span class="i-mingcute-check-circle-fill text-green-500" />
              {{ t('type_stats.has_floats') }}
            </span>
            <span v-if="typeStats.numbers.hasNegative" class="flex items-center gap-1">
              <span class="i-mingcute-check-circle-fill text-green-500" />
              {{ t('type_stats.has_negatives') }}
            </span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
