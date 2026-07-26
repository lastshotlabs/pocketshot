import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiClient } from '../api/client'
import type { AppStateManager } from '../app-state/manager'
import { OfflineQueue } from './queue'
import { OfflineCommandProcessor } from './processor'
import { checkNetworkStatus, useNetworkStatus } from './network'
import type {
  NewQueuedOperation,
  OfflineFlushResult,
  QueuedOperation,
  OfflineQueueOptions,
} from './types'

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
  const processor = new OfflineCommandProcessor(queue, api)
  let activeFlushController: AbortController | null = null

  // Start flushing when the app comes to foreground
  appStateManager.onForeground(() => {
    void flushQueue()
  })
  appStateManager.onBackground(() => {
    activeFlushController?.abort()
  })

  async function flushQueue(): Promise<OfflineFlushResult> {
    const status = await checkNetworkStatus()
    if (!status.isConnected) {
      return {
        flushed: 0,
        failed: 0,
        deadLettered: 0,
        deferred: 0,
        authorizationRequired: false,
        cancelled: false,
      }
    }
    activeFlushController ??= new AbortController()
    try {
      return await processor.flush(activeFlushController.signal)
    } finally {
      activeFlushController = null
    }
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
      async (op: NewQueuedOperation): Promise<QueuedOperation> => {
        const queued = await queue.enqueue(op)
        await refreshQueue()
        return queued
      },
      [refreshQueue],
    )

    const flush = useCallback(async (): Promise<OfflineFlushResult> => {
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

    const retryDeadLetter = useCallback(
      async (id: string) => {
        await queue.retryDeadLetter(id)
        await refreshQueue()
      },
      [refreshQueue],
    )

    const cancel = useCallback(
      async (id: string) => {
        const cancelled = await queue.cancel(id)
        await refreshQueue()
        return cancelled
      },
      [refreshQueue],
    )

    return {
      queuedOps,
      queueCount: queuedOps.length,
      isOnline: networkStatus.isConnected,
      networkStatus,
      isFlushing,
      enqueue,
      flush,
      clearQueue,
      retryDeadLetter,
      cancel,
      getDeadLetters: () => queue.getDeadLetters(),
      getDiagnostics: () => queue.getDiagnostics(),
    }
  }

  return { useNetworkStatus, useOfflineQueue, flushQueue }
}

export type OfflineHooks = ReturnType<typeof createOfflineHooks>
