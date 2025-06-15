<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale } from '@/composables/useInitI18n'
import { useI18n } from 'vue-i18n'
import locales from '../../locales/_locales.json'

const lang = useLocale()
const i18n = useI18n()
</script>

<template>
  <Select v-model="lang">
    <SelectTrigger>
      <SelectValue :aria-label="$t(`locales.${lang}`)">
        {{ $t(`locales.${lang}`) }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="item of i18n.availableLocales" :key="item" :value="item" :text-value="$t(`locales.${item}`)">
        <p class="font-medium">
          {{ (locales as any)[item] }}
        </p>
        <p v-if="item !== lang" class="text-xs text-slate-500">
          {{ $t(`locales.${item}`) }}
        </p>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<style scoped></style>
