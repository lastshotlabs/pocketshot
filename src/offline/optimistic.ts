import type { ApiClient } from '../api/client'
import { OfflineCommandProcessor } from './processor'
import type { OfflineQueue } from './queue'
import type { NewQueuedOperation, OfflineFlushResult, QueuedOperation } from './types'

export interface OptimisticMutationAdapter {
  /** Apply the local cache/UI change after the command is durably queued. */
  apply(operation: QueuedOperation): void | Promise<void>
  /** Finalize temporary IDs or cache metadata after server acknowledgement. */
  commit?(operation: QueuedOperation): void | Promise<void>
  /** Roll back terminal failures using the operation's optimistic context. */
  rollback(operation: QueuedOperation, error: unknown): void | Promise<void>
  /**
   * Rebuild optimistic cache state after process restart. Implementations
   * should compare queued commands with an authoritative server snapshot.
   */
  reconcile?(queued: QueuedOperation[], deadLetters: QueuedOperation[]): void | Promise<void>
}

/**
 * Coordinates durable enqueue with optimistic cache application and terminal
 * rollback. `recover()` is the process-restart bridge for rehydrating cache
 * state from persisted commands before normal rendering resumes.
 */
export class OptimisticOfflineMutations {
  private readonly processor: OfflineCommandProcessor

  constructor(
    private readonly queue: OfflineQueue,
    api: ApiClient,
    private readonly adapter: OptimisticMutationAdapter,
  ) {
    this.processor = new OfflineCommandProcessor(queue, api, {
      onSuccess: (operation) => adapter.commit?.(operation),
      onDeadLetter: (operation, error) => adapter.rollback(operation, error),
    })
  }

  async enqueue(input: NewQueuedOperation): Promise<QueuedOperation> {
    const operation = await this.queue.enqueue(input)
    try {
      await this.adapter.apply(operation)
      return operation
    } catch (error) {
      await this.queue.dequeue(operation.id)
      throw error
    }
  }

  flush(): Promise<OfflineFlushResult> {
    return this.processor.flush()
  }

  async recover(): Promise<void> {
    await this.adapter.reconcile?.(await this.queue.getAll(), await this.queue.getDeadLetters())
  }
}
