import type { DraftStorage, DurableDraftRecord } from './types'

export function createMemoryDraftStorage(): DraftStorage {
  const records = new Map<string, DurableDraftRecord<unknown>>()
  return {
    async load<T>(id: string) {
      const record = records.get(id) as DurableDraftRecord<T> | undefined
      return record ? clone(record) : null
    },
    async save<T>(record: DurableDraftRecord<T>) {
      records.set(record.id, clone(record) as DurableDraftRecord<unknown>)
    },
    async remove(id: string) {
      records.delete(id)
    },
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
}

export function createSQLiteDraftStorage(databaseName = 'pocketshot_drafts.db'): DraftStorage {
  let SQLite: { openDatabaseSync(name: string): SQLiteDatabase }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SQLite = require('expo-sqlite') as typeof SQLite
  } catch {
    throw new Error(
      '[pocketshot] Durable draft storage requires expo-sqlite.\n' +
        'Install it: npx expo install expo-sqlite',
    )
  }
  const database = SQLite.openDatabaseSync(databaseName)
  let initialized: Promise<void> | null = null
  const initialize = () => {
    initialized ??= database.execAsync(
      `CREATE TABLE IF NOT EXISTS pocketshot_drafts (
        id TEXT PRIMARY KEY NOT NULL,
        schema_version INTEGER NOT NULL,
        record TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    )
    return initialized
  }

  return {
    async load<T>(id: string) {
      await initialize()
      const row = await database.getFirstAsync<{ record: string }>(
        'SELECT record FROM pocketshot_drafts WHERE id = ?;',
        [id],
      )
      return row ? (JSON.parse(row.record) as DurableDraftRecord<T>) : null
    },
    async save<T>(record: DurableDraftRecord<T>) {
      await initialize()
      await database.runAsync(
        `INSERT INTO pocketshot_drafts (id, schema_version, record, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           schema_version = excluded.schema_version,
           record = excluded.record,
           updated_at = excluded.updated_at;`,
        [record.id, record.schemaVersion, JSON.stringify(record), record.updatedAt],
      )
    },
    async remove(id: string) {
      await initialize()
      await database.runAsync('DELETE FROM pocketshot_drafts WHERE id = ?;', [id])
    },
  }
}
