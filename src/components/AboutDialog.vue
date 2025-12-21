<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const gitInfo = __GIT_DEFINE__

const formattedCommitTimestamp = computed(() => {
  if (!gitInfo.commitTimestamp)
    return ''
  const date = new Date(gitInfo.commitTimestamp)
  return date.toLocaleString()
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle class="flex items-center justify-center gap-2 text-xl">
          <div class="i-custom-demiurge text-2xl" />
          Demiurge
        </DialogTitle>
        <DialogDescription class="text-center">
          {{ t('about.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-4">
        <!-- Version -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.version') }}</span>
          <span>0.0.1-alpha</span>
        </div>

        <!-- Author -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.author') }}</span>
          <a
            href="https://github.com/daidr"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline"
          >
            daidr
          </a>
        </div>

        <!-- License -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.license') }}</span>
          <span>MIT</span>
        </div>

        <!-- GitHub -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">GitHub</span>
          <a
            href="https://github.com/daidr/demiurge"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline"
          >
            daidr/demiurge
          </a>
        </div>

        <!-- Build Time -->
        <div v-if="formattedCommitTimestamp" class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.build_time') }}</span>
          <span class="font-mono text-xs">{{ formattedCommitTimestamp }}</span>
        </div>

        <!-- Git Commit -->
        <div v-if="gitInfo.shortCommitHash" class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.commit') }}</span>
          <a
            :href="`https://github.com/${gitInfo.owner}/${gitInfo.repo}/commit/${gitInfo.shortCommitHash}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs text-blue-600 hover:underline"
          >
            {{ gitInfo.shortCommitHash }}
          </a>
        </div>

        <!-- Pull Request -->
        <div v-if="gitInfo.pr" class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ t('about.pull_request') }}</span>
          <a
            :href="`https://github.com/${gitInfo.owner}/${gitInfo.repo}/pull/${gitInfo.pr}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs text-blue-600 hover:underline"
          >
            #{{ gitInfo.pr }}
          </a>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
