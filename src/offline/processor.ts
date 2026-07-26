import { ApiError, type ApiClient } from '../api/client'
import type { OfflineFlushResult, QueuedOperation } from './types'
import type { OfflineQueue } from './queue'

export interface OfflineCommandProcessorOptions {
  onSuccess?: (operation: QueuedOperation) => void | Promise<void>
  onDeadLetter?: (operation: QueuedOperation, error: unknown) => void | Promise<void>
  onAuthorizationRequired?: (operation: QueuedOperation, error: unknown) => void | Promise<void>
}

export class OfflineCommandProcessor {
  private activeFlush: Promise<OfflineFlushResult> | null = null

  constructor(
    private readonly queue: OfflineQueue,
    private readonly api: ApiClient,
    private readonly options: OfflineCommandProcessorOptions = {},
  ) {}

  flush(signal?: AbortSignal): Promise<OfflineFlushResult> {
    this.activeFlush ??= this.performFlush(signal).finally(() => {
      this.activeFlush = null
    })
    return this.activeFlush
  }

  private async performFlush(signal?: AbortSignal): Promise<OfflineFlushResult> {
    const result: OfflineFlushResult = {
      flushed: 0,
      failed: 0,
      deadLettered: 0,
      deferred: 0,
      authorizationRequired: false,
      cancelled: false,
    }
    const pending = await this.queue.getAll()
    const readyIds = new Set((await this.queue.getReady()).map((operation) => operation.id))

    for (const [index, operation] of pending.entries()) {
      if (signal?.aborted) {
        result.cancelled = true
        result.deferred += pending.length - index
        break
      }
      if (!readyIds.has(operation.id)) {
        // FIFO is strict: a later command may depend on this deferred command.
        result.deferred += pending.length - index
        break
      }
      await this.queue.markProcessing(operation.id)
      try {
        await this.execute(operation, signal)
        await this.queue.dequeue(operation.id)
        await this.options.onSuccess?.(operation)
        result.flushed += 1
      } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
          const abortError = new Error('Aborted')
          abortError.name = 'AbortError'
          await this.queue.markRetry(operation.id, abortError, 0)
          result.cancelled = true
          result.deferred += pending.length - index
          break
        }
        result.failed += 1
        if (this.isAuthorizationRequired(error)) {
          await this.queue.markRetry(operation.id, error, 0)
          await this.options.onAuthorizationRequired?.(operation, error)
          result.authorizationRequired = true
          result.deferred += pending.length - index
          break
        }
        const terminal =
          !this.isRetryable(error) || operation.attempts + 1 >= this.queue.maxAttemptCount
        if (terminal) {
          await this.queue.moveToDeadLetter(operation.id, error)
          await this.options.onDeadLetter?.(operation, error)
          result.deadLettered += 1
        } else {
          await this.queue.markRetry(operation.id, error, this.retryAfterMs(error))
        }
        // Preserve command ordering: later commands may depend on this one.
        break
      }
    }
    return result
  }

  private execute(operation: QueuedOperation, signal?: AbortSignal): Promise<unknown> {
    const options = {
      headers: { 'Idempotency-Key': operation.idempotencyKey },
      ...(signal ? { signal } : {}),
    }
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

  private isAuthorizationRequired(error: unknown): boolean {
    return error instanceof ApiError && (error.status === 401 || error.status === 403)
  }

  private retryAfterMs(error: unknown): number | undefined {
    return error instanceof ApiError ? error.retryAfterMs : undefined
  }
}
