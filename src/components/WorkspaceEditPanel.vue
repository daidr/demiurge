<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { randomEmoji } from '@/utils/emoji'

defineProps<{
  initialInfo?: {
    icon: string
    title: string
  }
}>()
</script>

<template>
  <div class="grid gap-4">
    <div class="space-y-2">
      <h4 class="font-medium leading-none">
        {{
          initialInfo ? $t('workspace.edit_workspace') : $t('workspace.create_workspace')
        }}
      </h4>
    </div>
    <div class="grid gap-2">
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="icon">{{ $t("workspace.icon") }}</Label>
        <Input id="icon" type="text" :default-value="initialInfo?.icon ? initialInfo.icon : randomEmoji()" class="col-span-2 h-8" />
      </div>
      <div class="grid grid-cols-3 items-center gap-4">
        <Label for="label">{{ $t("workspace.label") }}</Label>
        <Input id="label" type="text" default-value="300px" class="col-span-2 h-8" />
      </div>
      <div class="grid grid-cols-3 content-end gap-4">
        <Button size="xs" class="col-start-3">
          创建
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
