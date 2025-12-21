<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { watch } from 'vue'

const intervalMS = 30 * 60 * 1000

const { needRefresh, updateServiceWorker } = useRegisterSW({
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

watch(() => needRefresh.value, (newVal) => {
  if (newVal) {
    updateServiceWorker()
  }
})
</script>

<template>
  <div />
</template>

<style></style>
