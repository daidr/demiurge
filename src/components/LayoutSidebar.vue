<script setup lang="ts">

</script>

<template>
  <div>
    <div class="flex p-1">
      <select class="min-w-0 flex-grow rounded-sm">
        <option value="default">
          Default Profile
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
select {
  @apply rounded-sm bg-black/5;

  &:hover,
  &:focus {
    @apply bg-black text-white shadow-md shadow-black/20;
  }
}
</style>
