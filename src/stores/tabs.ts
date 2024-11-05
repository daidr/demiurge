import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Profile } from './profiles'

export interface TabListItem {
  id: string
  title: string
  createdTime: number
  updatedTime: number
  loading: boolean
  /** 图标，仅支持单字符 emoji */
  icon: string
  profile: Profile
  inputJSON: string
  cachedOutput: string
  statements: string[]
}

export const useTabStore = defineStore('tab', () => {
  const isTabsLoading = ref(false)
  const tabs = ref<TabListItem[]>([])
  const activeTabId = ref<string | null>(null)
  const activeTab = computed(() => tabs.value.find(tab => tab.id === activeTabId.value))

  return { tabs, isTabsLoading, activeTabId, activeTab }
})
