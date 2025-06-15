import type { TPersistManager } from './persist_worker.ts'
import * as Comlink from 'comlink'

const PersistManager = Comlink.wrap<typeof TPersistManager>(new Worker(new URL('./persist_worker.ts', import.meta.url)))

const persistManagerPromised = new PersistManager()

export function getPersistManager() {
  return persistManagerPromised
}
