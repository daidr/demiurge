<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const { t } = useI18n()
const intervalMS = 30 * 60 * 1000

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, r) {
    r
    && setInterval(async () => {
      if (r.installing || !navigator)
        return

      if ('connection' in navigator && !navigator.onLine)
        return

      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache': 'no-store',
          'cache-control': 'no-cache',
        },
      })

      if (resp?.status === 200)
        await r.update()
    }, intervalMS)
  },
})

const isOpen = computed(() => needRefresh.value)

function close() {
  offlineReady.value = false
  needRefresh.value = false
}

function handleOpenChange(open: boolean) {
  if (!open) {
    close()
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <span class="i-mingcute-refresh-2-line" />
          {{ t('pwa.update_available') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('pwa.update_description') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="secondary" size="sm" @click="close">
          {{ t('common.cancel') }}
        </Button>
        <Button v-if="needRefresh" size="sm" @click="updateServiceWorker()">
          {{ t('pwa.reload') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
