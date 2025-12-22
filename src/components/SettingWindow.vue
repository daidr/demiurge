<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FloatingWindow } from '@/components/ui/floating-window'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PlaygroundModeToggle, SizeViewerModeToggle, ToolTabToggle } from '@/components/ui/toggle-group'
import { useLocale } from '@/composables/useInitI18n'
import { useSettingsStore } from '@/stores/settings'
import locales from '../../locales/_locales.json'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
})

const { t } = useI18n()
const i18n = useI18n()
const lang = useLocale()

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
</script>

<template>
  <FloatingWindow
    v-model="isOpen"
    :title="t('settings.title')"
    :initial-width="480"
    :initial-height="520"
    :min-width="400"
    :min-height="400"
  >
    <div class="h-full overflow-y-auto p-4">
      <div class="flex flex-col gap-6">
        <!-- Language Section -->
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-medium text-foreground">
            {{ t('settings.language') }}
          </h3>
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.display_language') }}
            </Label>
            <Select v-model="lang" class="w-40">
              <SelectTrigger size="sm" class="w-40">
                <SelectValue :aria-label="t(`locales.${lang}`)">
                  {{ t(`locales.${lang}`) }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item of i18n.availableLocales"
                  :key="item"
                  :value="item"
                  :text-value="t(`locales.${item}`)"
                >
                  <p class="font-medium">
                    {{ (locales as any)[item] }}
                  </p>
                  <p v-if="item !== lang" class="text-xs text-slate-500">
                    {{ t(`locales.${item}`) }}
                  </p>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Appearance Section -->
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-medium text-foreground">
            {{ t('settings.appearance') }}
          </h3>
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.show_github_button') }}
            </Label>
            <Switch
              :model-value="settings.showGitHubButton"
              @update:model-value="settingsStore.updateSetting('showGitHubButton', $event)"
            />
          </div>
        </div>

        <!-- Tools Section -->
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-medium text-foreground">
            {{ t('settings.tools') }}
          </h3>

          <!-- Default Tool Tab -->
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.default_tool_tab') }}
            </Label>
            <ToolTabToggle
              size="sm"
              :model-value="settings.defaultToolTab"
              @update:model-value="settingsStore.updateSetting('defaultToolTab', $event)"
            />
          </div>

          <!-- Default Size Viewer Mode -->
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.default_size_viewer_mode') }}
            </Label>
            <SizeViewerModeToggle
              size="sm"
              :model-value="settings.defaultSizeViewerMode"
              @update:model-value="settingsStore.updateSetting('defaultSizeViewerMode', $event)"
            />
          </div>

          <!-- Default Playground Mode -->
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.default_playground_mode') }}
            </Label>
            <PlaygroundModeToggle
              size="sm"
              :model-value="settings.defaultPlaygroundMode"
              @update:model-value="settingsStore.updateSetting('defaultPlaygroundMode', $event)"
            />
          </div>

          <!-- Default Playground Auto Run -->
          <div class="flex items-center justify-between">
            <Label class="text-sm text-muted-foreground">
              {{ t('settings.default_playground_auto_run') }}
            </Label>
            <Switch
              :model-value="settings.defaultPlaygroundAutoRun"
              @update:model-value="settingsStore.updateSetting('defaultPlaygroundAutoRun', $event)"
            />
          </div>
        </div>

        <!-- Editor Section -->
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-medium text-foreground">
            {{ t('settings.editor') }}
          </h3>
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <Label class="text-sm text-muted-foreground">
                {{ t('settings.auto_format_on_paste') }}
              </Label>
              <span class="text-xs text-muted-foreground/70">
                {{ t('settings.auto_format_on_paste_hint') }}
              </span>
            </div>
            <Switch
              :model-value="settings.autoFormatOnPaste"
              @update:model-value="settingsStore.updateSetting('autoFormatOnPaste', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </FloatingWindow>
</template>
