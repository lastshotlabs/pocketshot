import { ApiError, type ApiClient } from '../api/client'
import type { OfflineFlushResult, QueuedOperation } from './types'
import type { OfflineQueue } from './queue'

export interface OfflineCommandProcessorOptions {
  onSuccess?: (operation: QueuedOperation) => void | Promise<void>
  onDeadLetter?: (operation: QueuedOperation, error: unknown) => void | Promise<void>
}

export class OfflineCommandProcessor {
  private activeFlush: Promise<OfflineFlushResult> | null = null

  constructor(
    private readonly queue: OfflineQueue,
    private readonly api: ApiClient,
    private readonly options: OfflineCommandProcessorOptions = {},
  ) {}

  flush(): Promise<OfflineFlushResult> {
    this.activeFlush ??= this.performFlush().finally(() => {
      this.activeFlush = null
    })
    return this.activeFlush
  }

  private async performFlush(): Promise<OfflineFlushResult> {
    const result: OfflineFlushResult = {
      flushed: 0,
      failed: 0,
      deadLettered: 0,
      deferred: 0,
    }
    const pending = await this.queue.getAll()
    const readyIds = new Set((await this.queue.getReady()).map((operation) => operation.id))

    for (const [index, operation] of pending.entries()) {
      if (!readyIds.has(operation.id)) {
        // FIFO is strict: a later command may depend on this deferred command.
        result.deferred += pending.length - index
        break
      }
      await this.queue.markProcessing(operation.id)
      try {
        await this.execute(operation)
        await this.queue.dequeue(operation.id)
        await this.options.onSuccess?.(operation)
        result.flushed += 1
      } catch (error) {
        result.failed += 1
        const terminal =
          !this.isRetryable(error) || operation.attempts + 1 >= this.queue.maxAttemptCount
        if (terminal) {
          const message = error instanceof Error ? error.message : String(error)
          await this.queue.moveToDeadLetter(operation.id, message)
          await this.options.onDeadLetter?.(operation, error)
          result.deadLettered += 1
        } else {
          const message = error instanceof Error ? error.message : String(error)
          await this.queue.markRetry(operation.id, message)
        }
        // Preserve command ordering: later commands may depend on this one.
        break
      }
    }
    return result
  }

  private execute(operation: QueuedOperation): Promise<unknown> {
    const options = { headers: { 'Idempotency-Key': operation.idempotencyKey } }
    if (operation.method === 'POST') return this.api.post(operation.path, operation.body, options)
    if (operation.method === 'PUT') return this.api.put(operation.path, operation.body, options)
    if (operation.method === 'PATCH') return this.api.patch(operation.path, operation.body, options)
    return this.api.delete(operation.path, operation.body, options)
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof ApiError)) return true
    return (
      error.status >= 500 ||
      error.status === 408 ||
      error.status === 409 ||
      error.status === 425 ||
      error.status === 429
    )
  }
}
