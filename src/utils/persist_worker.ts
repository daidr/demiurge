import * as Comlink from 'comlink'

class PersistManager {
  async getEstimate() {
    return await navigator.storage.estimate()
  }
}

export type { PersistManager as TPersistManager }

Comlink.expose(PersistManager)
