import type { Ref } from 'vue'
import { randomEmoji } from '@/utils/emoji'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { uuidv7 } from 'uuidv7'
import { ref, shallowRef } from 'vue'

interface TabItem {
  id: string
  title: string
  desc: string
  createdTime: number
  updatedTime: number
  content: string
}

interface SnippetItem {
  id: string
  desc?: string
  content: string
}

export const DRAFT_WORKSPACE_ID = '__draft__'
const DRAFT_WORKSPACE = {
  id: DRAFT_WORKSPACE_ID,
  schema: '',
  title: '',
  desc: '',
  icon: '📝',
}

export enum WorkspaceStatus {
  /** 未初始化 */
  Uninitialized = 'uninitialized',
  /** 加载中 */
  Loading = 'loading',
  /** 加载失败 */
  Failed = 'Failed',
  /** 初始化完成 */
  Done = 'done',
}

class WorkspaceItem {
  readonly id: Ref<string>

  get isDraftWorkspace() {
    return this.id.value === DRAFT_WORKSPACE_ID
  }

  /** 工作区状态 */
  readonly status: Ref<WorkspaceStatus>

  /** 工作区加载错误 */
  readonly error: Ref<Error | null> = ref(null)

  /** 工作区元数据 */
  readonly metadata: Ref<{
    /** JSON Schema，可能为空，为空不应用 JSON schema，若解析失败则当作值为空处理。 */
    schema: string
    /** 工作区标题 */
    title: string
    /** 工作区描述 */
    desc: string
    /** 工作区图标 */
    icon: string
  } | null> = ref(null)

  private _opfsRoot?: FileSystemDirectoryHandle
  private _metadataHandle?: FileSystemFileHandle
  private _tabsDirectory?: FileSystemDirectoryHandle
  private _snippetsDirectory?: FileSystemDirectoryHandle
  private _tabs: Ref<TabItem[]> = ref([])
  private _snippets: Ref<SnippetItem[]> = ref([])

  constructor(params: {
    id: string
    initialMetadata?: {
      schema: string
      title: string
      desc: string
      icon: string
    }
  }) {
    const { id = uuidv7(), initialMetadata } = params
    this.id = ref(id)
    this.metadata = ref(initialMetadata ?? null)
    this.status = ref(WorkspaceStatus.Uninitialized)

    // 元数据初始化
    this.initMetadata()
  }

  async initMetadata() {
    if (this.status.value !== WorkspaceStatus.Uninitialized) {
      return
    }
    this.status.value = WorkspaceStatus.Loading
    this._opfsRoot = await navigator.storage.getDirectory()
    const workspaceDir = await this._opfsRoot.getDirectoryHandle('workspace', { create: true })
    const workspaceHandle = await workspaceDir.getDirectoryHandle(this.id.value, { create: true })
    this._metadataHandle = await workspaceHandle.getFileHandle('__metadata.json', { create: true })
    this._tabsDirectory = await workspaceHandle.getDirectoryHandle('tabs', { create: true })
    this._snippetsDirectory = await workspaceHandle.getDirectoryHandle('snippets', { create: true })

    try {
      if (this.metadata.value === null) {
        // 没有metadata，走加载流程
        const metadataData = JSON.parse(await (await this._metadataHandle.getFile()).text())
        if (!isMetadataValid(metadataData, this.id.value)) {
          this.status.value = WorkspaceStatus.Failed
          return
        }
        this.metadata.value = metadataData
      }
      else {
        // 提供了初始metadata，走初始化流程
        const stream = await this._metadataHandle.createWritable()
        await stream.write(new TextEncoder().encode(JSON.stringify(this.metadata.value)))
        stream.close()
      }
      this.status.value = WorkspaceStatus.Done
    }
    catch (error) {
      console.error(error)
      this.error.value = error as Error
      this.status.value = WorkspaceStatus.Failed
    }
  }
}

function isMetadataValid(metadata: any, id?: string) {
  // metadata 必须是一个对象
  if (typeof metadata !== 'object' || metadata === null) {
    return false
  }
  // metadata 必须有 id 属性
  if (!metadata.id || typeof metadata.id !== 'string') {
    return false
  }
  // 如果提供了 id，则必须与 metadata.id 相同
  if (id && metadata.id !== id) {
    return false
  }
  return true
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const isInited = ref(false)
  const workspaces = shallowRef<WorkspaceItem[]>([])

  const init = async () => {
    const opfsRoot = await navigator.storage.getDirectory()
    const workspaceDir = await opfsRoot.getDirectoryHandle('workspace', { create: true })
    const workspaceIds = new Set<string>()
    for await (const entry of workspaceDir.values()) {
      if (entry.kind === 'file') {
        console.error('已忽略意料之外的文件：', entry.name)
        return
      }
      // workspaces.value.push(new WorkspaceItem({
      //   id: entry.name,
      // }))
      workspaceIds.add(entry.name)
    }
    // 检查是否有草稿工作区
    if (!workspaceIds.has(DRAFT_WORKSPACE_ID)) {
      workspaces.value.push(new WorkspaceItem({
        id: DRAFT_WORKSPACE_ID,
        initialMetadata: DRAFT_WORKSPACE,
      }))
    }
    for (const workspaceId of workspaceIds) {
      const workspace = new WorkspaceItem({
        id: workspaceId,
      })
      workspaces.value.push(workspace)
    }
  }

  init()

  return {
    isInited,
    workspaces,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkspaceStore, import.meta.hot))
}
