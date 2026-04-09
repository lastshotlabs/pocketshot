/**
 * Generates the offline queue sync hook.
 * Placed at lib/useOfflineSync.ts in the scaffolded app.
 */
export function offlineProviderTemplate(): string {
  return `import { useEffect } from 'react'
import { pocketshot } from '@/lib/pocketshot'

/**
 * Mounts the offline queue flusher.
 * Call this in your root layout — it auto-replays queued operations when you come back online.
 */
export function useOfflineSync() {
  const { useOfflineQueue } = pocketshot
  const { queueCount, isOnline, flush } = useOfflineQueue()

  useEffect(() => {
    if (isOnline && queueCount > 0) {
      void flush()
    }
  }, [isOnline, queueCount])

  return { queueCount, isOnline }
}
`
}
