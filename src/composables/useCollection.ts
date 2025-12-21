import type { BaseItem, Collection, Selector, SortSpecifier } from '@signaldb/core'
import type { ComputedRef, Ref } from 'vue'
import vueReactivityAdapter from '@signaldb/vue'
import { computed, ref, watchEffect } from 'vue'

/**
 * Reactive query for a collection with a dynamic selector
 */
export function useCollectionQuery<T extends BaseItem<I>, I>(
  collection: Collection<T, I, any>,
  selector: () => Partial<T> | Selector<T>,
  options?: { sort?: SortSpecifier<T> },
): Ref<T[]> {
  const items = ref<T[]>([]) as Ref<T[]>

  watchEffect((onCleanup) => {
    const cursor = collection.find(selector(), {
      reactive: vueReactivityAdapter,
      sort: options?.sort,
    })
    items.value = cursor.fetch()

    onCleanup(() => {
      cursor.cleanup()
    })
  })

  return items
}

/**
 * Reactive query for a single item by ID
 */
export function useCollectionItem<T extends BaseItem<I>, I>(
  collection: Collection<T, I, any>,
  idGetter: () => I | null | undefined,
): ComputedRef<T | null> {
  const items = ref<T[]>([]) as Ref<T[]>

  watchEffect((onCleanup) => {
    const id = idGetter()
    if (id == null) {
      items.value = []
      return
    }

    const cursor = collection.find({ id } as any, { reactive: vueReactivityAdapter })
    items.value = cursor.fetch()

    onCleanup(() => {
      cursor.cleanup()
    })
  })

  return computed(() => items.value[0] ?? null)
}

/**
 * Get all items from a collection reactively
 */
export function useCollectionAll<T extends BaseItem<I>, I>(
  collection: Collection<T, I, any>,
  options?: { sort?: SortSpecifier<T> },
): Ref<T[]> {
  return useCollectionQuery(collection, () => ({}), options)
}
