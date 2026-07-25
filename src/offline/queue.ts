import type {
  NewQueuedOperation,
  OfflineQueueOptions,
  OfflineQueueStorage,
  QueuedOperation,
} from './types'

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
  let operations = initial.map((operation) => ({ ...operation }))
  return {
    load: async () => operations.map((operation) => ({ ...operation })),
    save: async (next) => {
      operations = next.map((operation) => ({ ...operation }))
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

  constructor(options: OfflineQueueOptions = {}) {
    this.maxAttemptsValue = options.maxAttempts ?? 5
    this.retryDelay = options.retryDelay ?? 1_000
    this.maxRetryDelay = options.maxRetryDelay ?? 30_000
    this.now = options.now ?? (() => new Date())
    this.createId =
      options.createId ?? (() => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
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
          ? { ...operation, status: 'queued', lastError: 'Recovered after process interruption' }
          : operation,
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
      const id = this.createId()
      const idempotencyKey = input.idempotencyKey ?? id
      const existing = this.operations.find(
        (operation) => operation.idempotencyKey === idempotencyKey,
      )
      if (existing) return { ...existing }
      const operation: QueuedOperation = {
        schemaVersion: 2,
        id,
        idempotencyKey,
        method: input.method,
        path: input.path,
        body: input.body,
        queuedAt: this.now().toISOString(),
        attempts: 0,
        status: 'queued',
        nextAttemptAt: null,
        lastError: null,
        ...(input.optimisticContext === undefined
          ? {}
          : { optimisticContext: input.optimisticContext }),
      }
      this.operations.push(operation)
      await this.persist()
      return { ...operation }
    })
  }

  async dequeue(id: string): Promise<void> {
    await this.serialize(async () => {
      await this.load()
      this.operations = this.operations.filter((operation) => operation.id !== id)
      await this.persist()
    })
  }

  async markProcessing(id: string): Promise<void> {
    await this.update(id, { status: 'processing' })
  }

  async markRetry(id: string, error: string): Promise<QueuedOperation | null> {
    return this.serialize(async () => {
      await this.load()
      const operation = this.operations.find((candidate) => candidate.id === id)
      if (!operation) return null
      const attempts = operation.attempts + 1
      Object.assign(operation, {
        attempts,
        status: 'queued',
        lastError: error,
        nextAttemptAt: new Date(
          this.now().getTime() + this.retryDelayFor(attempts - 1),
        ).toISOString(),
      } satisfies Partial<QueuedOperation>)
      await this.persist()
      return { ...operation }
    })
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.markRetry(id, 'Replay failed')
  }

  async moveToDeadLetter(id: string, error: string): Promise<void> {
    await this.serialize(async () => {
      await this.load()
      const operation = this.operations.find((candidate) => candidate.id === id)
      if (!operation) return
      Object.assign(operation, {
        status: 'dead_letter',
        attempts: operation.attempts + 1,
        lastError: error,
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
      .map((operation) => ({ ...operation }))
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
      .map((operation) => ({ ...operation }))
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
