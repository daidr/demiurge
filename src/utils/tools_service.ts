import type { TToolsWorker } from './tools_worker'
import * as Comlink from 'comlink'

const ToolsWorker = Comlink.wrap<typeof TToolsWorker>(
  new Worker(new URL('./tools_worker.ts', import.meta.url), { type: 'module' }),
)

// Cache the resolved worker instance
let resolvedWorker: Comlink.Remote<TToolsWorker> | null = null
const workerPromise = new ToolsWorker()

export async function getToolsWorker(): Promise<Comlink.Remote<TToolsWorker>> {
  if (!resolvedWorker) {
    resolvedWorker = await workerPromise
  }
  return resolvedWorker
}
