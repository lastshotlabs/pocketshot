/** Network connectivity status. */
export interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

/** A single queued operation waiting to be replayed. */
export interface QueuedOperation {
  /** Storage schema version for forward migrations. */
  schemaVersion: 2
  /** Unique ID for this queued operation. */
  id: string
  /** Stable key sent with every replay so the server can deduplicate writes. */
  idempotencyKey: string
  /** HTTP method: 'POST', 'PUT', 'PATCH', 'DELETE'. */
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** API path, e.g. '/community/threads'. */
  path: string
  /** Request body (serializable to JSON). */
  body: unknown
  /** ISO timestamp when the operation was queued. */
  queuedAt: string
  /** Number of retry attempts so far. */
  attempts: number
  /** Current durable processing state. */
  status: 'queued' | 'processing' | 'dead_letter'
  /** Earliest ISO timestamp at which this command may be retried. */
  nextAttemptAt: string | null
  /** Last replay error, retained for diagnostics and dead-letter recovery. */
  lastError: string | null
  /** Optional durable metadata used to reconcile optimistic UI after restart. */
  optimisticContext?: unknown
}

export interface OfflineQueueStorage {
  load(): Promise<QueuedOperation[]>
  save(operations: QueuedOperation[]): Promise<void>
  clear(): Promise<void>
}

/** Options for the offline queue. */
export interface OfflineQueueOptions {
  /** Maximum number of retry attempts before giving up. Default: 5. */
  maxAttempts?: number
  /** Retry delay in ms (doubles with each attempt, capped at 30s). Default: 1000. */
  retryDelay?: number
  /** Maximum retry delay. Default: 30000. */
  maxRetryDelay?: number
  /** Inject storage for tests or a custom durable backend. */
  storage?: OfflineQueueStorage
  /** Injectable clock used for deterministic replay. */
  now?: () => Date
  /** Injectable ID factory. The same ID is used as the idempotency key by default. */
  createId?: () => string
  /** Maximum durable commands, including dead letters. Default: 1000. */
  maxOperations?: number
  /** Maximum serialized bytes for one command body and optimistic context. Default: 512 KiB. */
  maxOperationBytes?: number
  /** Maximum serialized bytes retained by the queue. Default: 10 MiB. */
  maxBytes?: number
  /** Converts replay failures into bounded, privacy-safe durable diagnostics. */
  sanitizeError?: (error: unknown) => string
}

export type NewQueuedOperation = Pick<QueuedOperation, 'method' | 'path' | 'body'> &
  Partial<Pick<QueuedOperation, 'idempotencyKey' | 'optimisticContext'>>

export interface OfflineFlushResult {
  flushed: number
  failed: number
  deadLettered: number
  deferred: number
  authorizationRequired: boolean
  cancelled: boolean
}

/** Non-sensitive queue health suitable for support diagnostics and telemetry. */
export interface OfflineQueueDiagnostics {
  total: number
  queued: number
  processing: number
  deadLettered: number
  bytes: number
  oldestQueuedAt: string | null
}
