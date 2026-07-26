import type {
  NewQueuedOperation,
  OfflineQueueOptions,
  OfflineQueueStorage,
  QueuedOperation,
  OfflineQueueDiagnostics,
} from './types'

const DEFAULT_MAX_OPERATIONS = 1_000
const DEFAULT_MAX_OPERATION_BYTES = 512 * 1024
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024
const MAX_ERROR_LENGTH = 160

export class OfflineQueueCapacityError extends Error {
  constructor(message = 'Offline queue capacity exceeded') {
    super(message)
    this.name = 'OfflineQueueCapacityError'
  }
}

export class InvalidOfflineOperationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidOfflineOperationError'
  }
}

function jsonClone<T>(value: T, label = 'value'): T {
  let serialized: string | undefined
  try {
    serialized = JSON.stringify(value)
  } catch {
    throw new InvalidOfflineOperationError(`${label} must be JSON serializable`)
  }
  if (serialized === undefined) {
    throw new InvalidOfflineOperationError(`${label} must be JSON serializable`)
  }
  return JSON.parse(serialized) as T
}

function operationBytes(operation: QueuedOperation): number {
  return new TextEncoder().encode(JSON.stringify(operation)).byteLength
}

function cloneOperation(operation: QueuedOperation): QueuedOperation {
  return jsonClone(operation, 'operation')
}

function defaultSanitizeError(error: unknown): string {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status)
    if (Number.isInteger(status)) return `Request failed (${status})`
  }
  return error instanceof Error ? error.name : 'Replay failed'
}

interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
}

function tryLoadSQLite(): { openDatabaseSync(name: string): SQLiteDatabase } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sqlite') as { openDatabaseSync(name: string): SQLiteDatabase }
  } catch {
    return null
  }
}

function createSQLiteStorage(): OfflineQueueStorage | null {
  const SQLite = tryLoadSQLite()
  if (!SQLite) return null
  const database = SQLite.openDatabaseSync('pocketshot_offline.db')
  let initialized: Promise<void> | null = null
  const initialize = () => {
    initialized ??= (async () => {
      await database.execAsync(
        `CREATE TABLE IF NOT EXISTS offline_commands_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        schema_version INTEGER NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        body TEXT NOT NULL,
        queued_at TEXT NOT NULL,
        attempts INTEGER NOT NULL,
        status TEXT NOT NULL,
        next_attempt_at TEXT,
        last_error TEXT,
        optimistic_context TEXT
      );`,
      )
      const legacy = await database.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'offline_queue';",
      )
      if (legacy) {
        await database.execAsync('BEGIN IMMEDIATE;')
        try {
          await database.execAsync(
            `INSERT OR IGNORE INTO offline_commands_v2
             (id, schema_version, idempotency_key, method, path, body, queued_at,
              attempts, status, next_attempt_at, last_error, optimistic_context)
             SELECT id, 2, id, method, path, body, queued_at, attempts,
                    'queued', NULL, NULL, NULL
             FROM offline_queue;
             DROP TABLE offline_queue;`,
          )
          await database.execAsync('COMMIT;')
        } catch (error) {
          await database.execAsync('ROLLBACK;')
          throw error
        }
      }
    })()
    return initialized
  }

  return {
    async load() {
      await initialize()
      const rows = await database.getAllAsync<{
        id: string
        schema_version: number
        idempotency_key: string
        method: QueuedOperation['method']
        path: string
        body: string
        queued_at: string
        attempts: number
        status: QueuedOperation['status']
        next_attempt_at: string | null
        last_error: string | null
        optimistic_context: string | null
      }>('SELECT * FROM offline_commands_v2 ORDER BY queued_at ASC, id ASC;')
      return rows.map((row) => ({
        schemaVersion: 2,
        id: row.id,
        idempotencyKey: row.idempotency_key,
        method: row.method,
        path: row.path,
        body: JSON.parse(row.body) as unknown,
        queuedAt: row.queued_at,
        attempts: row.attempts,
        status: row.status,
        nextAttemptAt: row.next_attempt_at,
        lastError: row.last_error,
        ...(row.optimistic_context
          ? { optimisticContext: JSON.parse(row.optimistic_context) as unknown }
          : {}),
      }))
    },
    async save(operations) {
      await initialize()
      await database.execAsync('BEGIN IMMEDIATE;')
      try {
        await database.execAsync('DELETE FROM offline_commands_v2;')
        for (const operation of operations) {
          await database.runAsync(
            `INSERT INTO offline_commands_v2
             (id, schema_version, idempotency_key, method, path, body, queued_at,
              attempts, status, next_attempt_at, last_error, optimistic_context)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              operation.id,
              operation.schemaVersion,
              operation.idempotencyKey,
              operation.method,
              operation.path,
              JSON.stringify(operation.body),
              operation.queuedAt,
              operation.attempts,
              operation.status,
              operation.nextAttemptAt,
              operation.lastError,
              operation.optimisticContext === undefined
                ? null
                : JSON.stringify(operation.optimisticContext),
            ],
          )
        }
        await database.execAsync('COMMIT;')
      } catch (error) {
        await database.execAsync('ROLLBACK;')
        throw error
      }
    },
    async clear() {
      await initialize()
      await database.execAsync('DELETE FROM offline_commands_v2;')
    },
  }
}

export function createMemoryOfflineQueueStorage(
  initial: QueuedOperation[] = [],
): OfflineQueueStorage {
  let operations = initial.map(cloneOperation)
  return {
    load: async () => operations.map(cloneOperation),
    save: async (next) => {
      operations = next.map(cloneOperation)
    },
    clear: async () => {
      operations = []
    },
  }
}

/**
 * Durable FIFO command queue. Processing state, retry schedule, idempotency
 * keys, optimistic metadata, and dead letters survive process restarts.
 */
export class OfflineQueue {
  private readonly storage: OfflineQueueStorage
  private operations: QueuedOperation[] = []
  private loaded = false
  private loadPromise: Promise<void> | null = null
  private mutationChain: Promise<void> = Promise.resolve()
  private readonly maxAttemptsValue: number
  private readonly retryDelay: number
  private readonly maxRetryDelay: number
  private readonly now: () => Date
  private readonly createId: () => string
  private readonly maxOperations: number
  private readonly maxOperationBytes: number
  private readonly maxBytes: number
  private readonly sanitizeErrorValue: (error: unknown) => string

  constructor(options: OfflineQueueOptions = {}) {
    this.maxAttemptsValue = options.maxAttempts ?? 5
    this.retryDelay = options.retryDelay ?? 1_000
    this.maxRetryDelay = options.maxRetryDelay ?? 30_000
    this.now = options.now ?? (() => new Date())
    this.createId =
      options.createId ?? (() => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
    this.maxOperations = options.maxOperations ?? DEFAULT_MAX_OPERATIONS
    this.maxOperationBytes = options.maxOperationBytes ?? DEFAULT_MAX_OPERATION_BYTES
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    this.sanitizeErrorValue = options.sanitizeError ?? defaultSanitizeError
    if (
      this.maxAttemptsValue < 1 ||
      this.maxOperations < 1 ||
      this.maxOperationBytes < 1 ||
      this.maxBytes < 1
    ) {
      throw new RangeError('Offline queue limits must be positive')
    }
    const sqliteStorage = options.storage ? null : createSQLiteStorage()
    this.storage = options.storage ?? sqliteStorage ?? createMemoryOfflineQueueStorage()
    if (!options.storage && !sqliteStorage) {
      console.warn(
        '[pocketshot] expo-sqlite not found. Offline queue is in-memory only (operations will be lost on restart).\n' +
          'Install it: npx expo install expo-sqlite',
      )
    }
  }

  async load(): Promise<void> {
    if (this.loaded) return
    if (this.loadPromise) return this.loadPromise
    this.loadPromise = (async () => {
      const loaded = await this.storage.load()
      this.operations = loaded.map((operation) =>
        operation.status === 'processing'
          ? {
              ...cloneOperation(operation),
              status: 'queued',
              lastError: 'Recovered after process interruption',
            }
          : cloneOperation(operation),
      )
      this.loaded = true
      await this.storage.save(this.operations)
    })()
    try {
      await this.loadPromise
    } finally {
      this.loadPromise = null
    }
  }

  async enqueue(input: NewQueuedOperation): Promise<QueuedOperation> {
    return this.serialize(async () => {
      await this.load()
      if (!input.path.startsWith('/') || input.path.startsWith('//')) {
        throw new InvalidOfflineOperationError('path must be an API-relative path')
      }
      const body = jsonClone(input.body, 'body')
      const optimisticContext =
        input.optimisticContext === undefined
          ? undefined
          : jsonClone(input.optimisticContext, 'optimisticContext')
      const id = this.createId()
      const idempotencyKey = input.idempotencyKey ?? id
      const existing = this.operations.find(
        (operation) => operation.idempotencyKey === idempotencyKey,
      )
      if (existing) return cloneOperation(existing)
      const operation: QueuedOperation = {
        schemaVersion: 2,
        id,
        idempotencyKey,
        method: input.method,
        path: input.path,
        body,
        queuedAt: this.now().toISOString(),
        attempts: 0,
        status: 'queued',
        nextAttemptAt: null,
        lastError: null,
        ...(input.optimisticContext === undefined ? {} : { optimisticContext }),
      }
      const bytes = operationBytes(operation)
      if (bytes > this.maxOperationBytes) {
        throw new OfflineQueueCapacityError('Offline operation exceeds its byte limit')
      }
      if (this.operations.length >= this.maxOperations) {
        throw new OfflineQueueCapacityError('Offline queue operation limit reached')
      }
      const currentBytes = this.operations.reduce((total, item) => total + operationBytes(item), 0)
      if (currentBytes + bytes > this.maxBytes) {
        throw new OfflineQueueCapacityError('Offline queue byte limit reached')
      }
      this.operations.push(operation)
      await this.persist()
      return cloneOperation(operation)
    })
  }

  async dequeue(id: string): Promise<void> {
    await this.serialize(async () => {
      await this.load()
      this.operations = this.operations.filter((operation) => operation.id !== id)
      await this.persist()
    })
  }

  /** Cancels a pending command and returns its optimistic context for UI rollback. */
  async cancel(id: string): Promise<QueuedOperation | null> {
    return this.serialize(async () => {
      await this.load()
      const index = this.operations.findIndex((operation) => operation.id === id)
      if (index < 0) return null
      const [removed] = this.operations.splice(index, 1)
      await this.persist()
      return removed ? cloneOperation(removed) : null
    })
  }

  async markProcessing(id: string): Promise<void> {
    await this.update(id, { status: 'processing' })
  }

  async markRetry(
    id: string,
    error: unknown,
    retryAfterMs?: number,
  ): Promise<QueuedOperation | null> {
    return this.serialize(async () => {
      await this.load()
      const operation = this.operations.find((candidate) => candidate.id === id)
      if (!operation) return null
      const attempts = operation.attempts + 1
      Object.assign(operation, {
        attempts,
        status: 'queued',
        lastError: this.sanitizeError(error),
        nextAttemptAt: new Date(
          this.now().getTime() +
            (retryAfterMs === undefined
              ? this.retryDelayFor(attempts - 1)
              : Math.max(0, Math.min(retryAfterMs, this.maxRetryDelay))),
        ).toISOString(),
      } satisfies Partial<QueuedOperation>)
      await this.persist()
      return cloneOperation(operation)
    })
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.markRetry(id, 'Replay failed')
  }

  async moveToDeadLetter(id: string, error: unknown): Promise<void> {
    await this.serialize(async () => {
      await this.load()
      const operation = this.operations.find((candidate) => candidate.id === id)
      if (!operation) return
      Object.assign(operation, {
        status: 'dead_letter',
        attempts: operation.attempts + 1,
        lastError: this.sanitizeError(error),
        nextAttemptAt: null,
      } satisfies Partial<QueuedOperation>)
      await this.persist()
    })
  }

  async retryDeadLetter(id: string): Promise<void> {
    await this.update(id, {
      status: 'queued',
      attempts: 0,
      lastError: null,
      nextAttemptAt: null,
    })
  }

  async getAll(): Promise<QueuedOperation[]> {
    await this.mutationChain
    await this.load()
    return this.operations
      .filter((operation) => operation.status !== 'dead_letter')
      .map(cloneOperation)
  }

  async getReady(): Promise<QueuedOperation[]> {
    const now = this.now().getTime()
    return (await this.getAll()).filter(
      (operation) =>
        operation.status === 'queued' &&
        (!operation.nextAttemptAt || Date.parse(operation.nextAttemptAt) <= now),
    )
  }

  async getDeadLetters(): Promise<QueuedOperation[]> {
    await this.mutationChain
    await this.load()
    return this.operations
      .filter((operation) => operation.status === 'dead_letter')
      .map(cloneOperation)
  }

  async getDiagnostics(): Promise<OfflineQueueDiagnostics> {
    await this.mutationChain
    await this.load()
    const active = this.operations.filter((operation) => operation.status !== 'dead_letter')
    return {
      total: this.operations.length,
      queued: this.operations.filter((operation) => operation.status === 'queued').length,
      processing: this.operations.filter((operation) => operation.status === 'processing').length,
      deadLettered: this.operations.filter((operation) => operation.status === 'dead_letter')
        .length,
      bytes: this.operations.reduce((total, operation) => total + operationBytes(operation), 0),
      oldestQueuedAt: active[0]?.queuedAt ?? null,
    }
  }

  async clear(): Promise<void> {
    await this.serialize(async () => {
      this.operations = []
      this.loaded = true
      await this.storage.clear()
    })
  }

  get maxAttemptCount(): number {
    return this.maxAttemptsValue
  }

  retryDelayFor(attempts: number): number {
    return Math.min(this.retryDelay * 2 ** attempts, this.maxRetryDelay)
  }

  sanitizeError(error: unknown): string {
    const sanitized = this.sanitizeErrorValue(error).replace(/\s+/g, ' ').trim()
    return (sanitized || 'Replay failed').slice(0, MAX_ERROR_LENGTH)
  }

  private async update(id: string, patch: Partial<QueuedOperation>): Promise<void> {
    await this.serialize(async () => {
      await this.load()
      const operation = this.operations.find((candidate) => candidate.id === id)
      if (!operation) return
      Object.assign(operation, patch)
      await this.persist()
    })
  }

  private async persist(): Promise<void> {
    await this.storage.save(this.operations)
  }

  private async serialize<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.mutationChain
    let release!: () => void
    this.mutationChain = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await operation()
    } finally {
      release()
    }
  }
}
