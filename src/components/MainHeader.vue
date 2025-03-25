<script setup lang="ts">
import LangSwitch from './LangSwitch.vue'
</script>

<template>
  <header class="flex select-none items-center justify-between border-b-1.5 border-gray-2">
    <div class="logo">
      <div class="i-custom-json-baker text-lg" />
      JSON Baker
    </div>
    <div class="flex gap-1 p-1">
      <a class="header-link" href="https://github.com/daidr/json-baker" target="_blank" rel="noopener noreferrer">
        <div class="i-mingcute-github-line" />
      </a>
      <LangSwitch />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-link {
  @apply text-xl p-0.5 rounded-sm;

  &:hover {
    @apply bg-black text-white shadow-md shadow-black/20;
  }
}

.logo {
  @apply my-0.5 ml-1 flex items-center gap-2 rounded-sm px-1 py-0.5 font-bold;

  &:hover {
    @apply bg-black text-white shadow-md shadow-black/20;
  }
}
</style>
