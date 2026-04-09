import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient } from '../api/client'
import type { AppStateManager } from '../app-state/manager'
import { OfflineQueue } from './queue'
import { checkNetworkStatus, useNetworkStatus } from './network'
import type { QueuedOperation, OfflineQueueOptions } from './types'

// ── Factory ───────────────────────────────────────────────────────────────────

interface CreateOfflineHooksOpts {
  api: ApiClient
  appStateManager: AppStateManager
  queueOptions?: OfflineQueueOptions
}

/**
 * Creates offline hooks bound to the SDK instance.
 */
export function createOfflineHooks(opts: CreateOfflineHooksOpts) {
  const { api, appStateManager } = opts
  const queue = new OfflineQueue(opts.queueOptions)

  // Start flushing when the app comes to foreground
  appStateManager.onForeground(() => {
    void flushQueue()
  })

  async function flushQueue(): Promise<{ flushed: number; failed: number }> {
    const status = await checkNetworkStatus()
    if (!status.isConnected) return { flushed: 0, failed: 0 }

    const ops = await queue.getAll()
    let flushed = 0
    let failed = 0

    for (const op of ops) {
      if (op.attempts >= queue.maxAttemptCount) {
        await queue.dequeue(op.id)
        failed++
        continue
      }

      try {
        if (op.method === 'POST') await api.post(op.path, op.body)
        else if (op.method === 'PUT') await api.put(op.path, op.body)
        else if (op.method === 'PATCH') await api.patch(op.path, op.body)
        else if (op.method === 'DELETE') await api.delete(op.path, op.body)

        await queue.dequeue(op.id)
        flushed++
      } catch {
        await queue.incrementAttempts(op.id)
        failed++
      }
    }

    return { flushed, failed }
  }

  /**
   * Returns the current offline queue state and controls.
   *
   * Automatically flushes pending operations when the device comes back online
   * and when the app returns to the foreground.
   *
   * @example
   * const { queuedOps, enqueue, flush, isOnline } = useOfflineQueue()
   *
   * // Queue a mutation when offline:
   * if (!isOnline) {
   *   await enqueue({ method: 'POST', path: '/community/threads', body: { title } })
   * }
   */
  function useOfflineQueue() {
    const [queuedOps, setQueuedOps] = useState<QueuedOperation[]>([])
    const [isFlushing, setIsFlushing] = useState(false)
    const networkStatus = useNetworkStatus()

    const refreshQueue = useCallback(async () => {
      const ops = await queue.getAll()
      setQueuedOps(ops)
    }, [])

    // Load queue on mount
    useEffect(() => {
      void refreshQueue()
    }, [refreshQueue])

    // Auto-flush when coming online
    const wasOnline = useRef(networkStatus.isConnected)
    useEffect(() => {
      if (networkStatus.isConnected && !wasOnline.current) {
        void flush()
      }
      wasOnline.current = networkStatus.isConnected
    }, [networkStatus.isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

    const enqueue = useCallback(
      async (
        op: Omit<QueuedOperation, 'id' | 'queuedAt' | 'attempts'>,
      ): Promise<QueuedOperation> => {
        const queued = await queue.enqueue(op)
        await refreshQueue()
        return queued
      },
      [refreshQueue],
    )

    const flush = useCallback(async (): Promise<{ flushed: number; failed: number }> => {
      setIsFlushing(true)
      try {
        const result = await flushQueue()
        await refreshQueue()
        return result
      } finally {
        setIsFlushing(false)
      }
    }, [refreshQueue]) // eslint-disable-line react-hooks/exhaustive-deps

    const clearQueue = useCallback(async () => {
      await queue.clear()
      setQueuedOps([])
    }, [])

    return {
      queuedOps,
      queueCount: queuedOps.length,
      isOnline: networkStatus.isConnected,
      networkStatus,
      isFlushing,
      enqueue,
      flush,
      clearQueue,
    }
  }

  return { useNetworkStatus, useOfflineQueue, flushQueue }
}

export type OfflineHooks = ReturnType<typeof createOfflineHooks>
