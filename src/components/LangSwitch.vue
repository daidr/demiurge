<script setup lang="ts">
import { useLocale } from '@/composables/useInitI18n'
import { useI18n } from 'vue-i18n'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const lang = useLocale()
const i18n = useI18n()
</script>

<template>
  <Select v-model="lang">
    <SelectTrigger>
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem  v-for="item of i18n.availableLocales" :key="item" :value="item">
        {{item}}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<style scoped>
select {
  @apply rounded-sm;

  &:hover,
  &:focus {
    @apply bg-black text-white shadow-md shadow-black/20;
  }
}
</style>
