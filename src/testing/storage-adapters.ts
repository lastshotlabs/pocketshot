import type { DraftStorage, DurableDraftRecord } from '../drafts/types'
import type { OfflineQueueStorage, QueuedOperation } from '../offline/types'
import type { RealtimeChannelStorage } from '../realtime/types'
import type { RestartableStore } from './process'

export function createRestartableOfflineStorage(
  store: RestartableStore,
  key = 'offline-commands',
): OfflineQueueStorage {
  return {
    async load() {
      return store.read<QueuedOperation[]>(key) ?? []
    },
    async save(operations) {
      store.write(key, operations)
    },
    async clear() {
      store.remove(key)
    },
  }
}

export function createRestartableDraftStorage(
  store: RestartableStore,
  prefix = 'draft:',
): DraftStorage {
  return {
    async load<T>(id: string) {
      return store.read<DurableDraftRecord<T>>(`${prefix}${id}`)
    },
    async save<T>(record: DurableDraftRecord<T>) {
      store.write(`${prefix}${record.id}`, record)
    },
    async remove(id: string) {
      store.remove(`${prefix}${id}`)
    },
  }
}

export function createRestartableRealtimeStorage(
  store: RestartableStore,
  prefix = 'realtime-cursor:',
): RealtimeChannelStorage {
  return {
    async loadCursor(channel) {
      return store.read<number>(`${prefix}${channel}`)
    },
    async saveCursor(channel, cursor) {
      store.write(`${prefix}${channel}`, cursor)
    },
    async clearCursor(channel) {
      store.remove(`${prefix}${channel}`)
    },
  }
}
