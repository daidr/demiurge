import { defineStore } from 'pinia'

export enum ProfileTypeEnum {
  // 与特定 tab 一一对应的 profile，储存在 tab content 中，而非 profile store
  TAB_SPECIFIC,
  // 与特定 tab 无关的 profile，储存在 profile store 中
  GLOBAL,
}

interface BaseProfile {
  id: string
  type: ProfileTypeEnum
}

interface ProfileDetail extends BaseProfile {
  /** JSON Schema，可能为空，为空不应用 JSON schema，若解析失败则当作值为空处理。 */
  schema: string
  /** Profile 的标题 */
  title: string
  /** Profile 的描述 */
  desc: string
  /** Profile 的创建时间 */
  createdTime: number
  /** Profile 的最后更新时间 */
  updatedTime: number
  /** Profile 的图标，仅支持单个 emoji */
  icon: string
}

export interface TabSpecificProfile extends BaseProfile, ProfileDetail {
  type: ProfileTypeEnum.TAB_SPECIFIC
}

export interface GlobalProfile extends BaseProfile {
  type: ProfileTypeEnum.GLOBAL
}

export interface FullGlobalProfile extends BaseProfile, ProfileDetail {
  type: ProfileTypeEnum.GLOBAL
}

export type Profile = TabSpecificProfile | GlobalProfile

export const useProfileStore = defineStore('profile', () => {
  return {}
})
