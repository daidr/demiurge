<script setup lang="ts">
import SchemaEditorButton from './instant/SchemaEditorButton.vue'
import SortJsonButton from './instant/SortJsonButton.vue'
</script>

<template>
  <div class="flex items-center gap-1 px-3 py-2 border-b border-border">
    <span class="text-sm font-medium mr-auto">Tools</span>

    <!-- Instant Tools -->
    <SchemaEditorButton />
    <SortJsonButton />
  </div>
</template>
