/** Network connectivity status. */
export interface NetworkStatus {
  isConnected: boolean
  isInternetReachable: boolean | null
  type: string | null
}

/** A single queued operation waiting to be replayed. */
export interface QueuedOperation {
  /** Unique ID for this queued operation. */
  id: string
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
}

/** Options for the offline queue. */
export interface OfflineQueueOptions {
  /** Maximum number of retry attempts before giving up. Default: 5. */
  maxAttempts?: number
  /** Retry delay in ms (doubles with each attempt, capped at 30s). Default: 1000. */
  retryDelay?: number
}
