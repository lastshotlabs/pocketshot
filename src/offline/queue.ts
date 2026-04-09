import type { QueuedOperation, OfflineQueueOptions } from './types'

// ── Storage backend ───────────────────────────────────────────────────────────

interface QueueStorage {
  load(): Promise<QueuedOperation[]>
  save(ops: QueuedOperation[]): Promise<void>
  clear(): Promise<void>
}

function tryLoadSQLite() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sqlite') as {
      openDatabaseSync(name: string): {
        execAsync(sql: string): Promise<void>
        getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>
        runAsync(sql: string, params?: unknown[]): Promise<{ changes: number }>
      }
    }
  } catch {
    return null
  }
}

function createSQLiteStorage(): QueueStorage | null {
  const SQLite = tryLoadSQLite()
  if (!SQLite) return null

  const db = SQLite.openDatabaseSync('pocketshot_offline.db')
  let initialized = false

  async function init() {
    if (initialized) return
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        body TEXT NOT NULL,
        queued_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0
      );`,
    )
    initialized = true
  }

  return {
    async load(): Promise<QueuedOperation[]> {
      await init()
      const rows = await db.getAllAsync<{
        id: string
        method: string
        path: string
        body: string
        queued_at: string
        attempts: number
      }>('SELECT * FROM offline_queue ORDER BY queued_at ASC;')
      return rows.map((r) => ({
        id: r.id,
        method: r.method as QueuedOperation['method'],
        path: r.path,
        body: JSON.parse(r.body) as unknown,
        queuedAt: r.queued_at,
        attempts: r.attempts,
      }))
    },
    async save(ops: QueuedOperation[]): Promise<void> {
      await init()
      await db.execAsync('DELETE FROM offline_queue;')
      for (const op of ops) {
        await db.runAsync(
          'INSERT INTO offline_queue (id, method, path, body, queued_at, attempts) VALUES (?, ?, ?, ?, ?, ?);',
          [op.id, op.method, op.path, JSON.stringify(op.body), op.queuedAt, op.attempts],
        )
      }
    },
    async clear(): Promise<void> {
      await init()
      await db.execAsync('DELETE FROM offline_queue;')
    },
  }
}

// ── OfflineQueue class ────────────────────────────────────────────────────────

/**
 * Persistent offline operation queue backed by expo-sqlite.
 * Falls back to in-memory storage with a warning when expo-sqlite is not installed.
 *
 * Loaded and used inside the factory (createOfflineHooks).
 */
export class OfflineQueue {
  private storage: QueueStorage
  private ops: QueuedOperation[] = []
  private loaded = false
  private readonly _maxAttempts: number
  private readonly _retryDelay: number

  constructor(opts: OfflineQueueOptions = {}) {
    this._maxAttempts = opts.maxAttempts ?? 5
    this._retryDelay = opts.retryDelay ?? 1000

    const sqliteStorage = createSQLiteStorage()
    if (sqliteStorage) {
      this.storage = sqliteStorage
    } else {
      console.warn(
        '[pocketshot] expo-sqlite not found. Offline queue is in-memory only (operations will be lost on restart).\n' +
          'Install it: npx expo install expo-sqlite',
      )
      let memOps: QueuedOperation[] = []
      this.storage = {
        load: async () => memOps,
        save: async (ops) => {
          memOps = [...ops]
        },
        clear: async () => {
          memOps = []
        },
      }
    }
  }

  async load(): Promise<void> {
    if (this.loaded) return
    this.ops = await this.storage.load()
    this.loaded = true
  }

  async enqueue(
    op: Omit<QueuedOperation, 'id' | 'queuedAt' | 'attempts'>,
  ): Promise<QueuedOperation> {
    await this.load()
    const queued: QueuedOperation = {
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    }
    this.ops.push(queued)
    await this.storage.save(this.ops)
    return queued
  }

  async dequeue(id: string): Promise<void> {
    await this.load()
    this.ops = this.ops.filter((op) => op.id !== id)
    await this.storage.save(this.ops)
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.load()
    const op = this.ops.find((o) => o.id === id)
    if (op) {
      op.attempts += 1
      await this.storage.save(this.ops)
    }
  }

  async getAll(): Promise<QueuedOperation[]> {
    await this.load()
    return [...this.ops]
  }

  async clear(): Promise<void> {
    this.ops = []
    await this.storage.clear()
  }

  get maxAttemptCount(): number {
    return this._maxAttempts
  }

  retryDelayFor(attempts: number): number {
    return Math.min(this._retryDelay * Math.pow(2, attempts), 30_000)
  }
}
