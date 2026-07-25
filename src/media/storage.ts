import type { DurableMediaRecord, MediaPipelineStorage } from './types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function createMemoryMediaStorage(initial: DurableMediaRecord[] = []): MediaPipelineStorage {
  let records = clone(initial)
  return {
    load: async () => clone(records),
    save: async (next) => {
      records = clone(next)
    },
  }
}

interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
}

export function createSQLiteMediaStorage(
  databaseName = 'pocketshot_media.db',
): MediaPipelineStorage {
  let SQLite: { openDatabaseSync(name: string): SQLiteDatabase }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SQLite = require('expo-sqlite') as typeof SQLite
  } catch {
    throw new Error(
      '[pocketshot] Durable media storage requires expo-sqlite.\n' +
        'Install it: npx expo install expo-sqlite',
    )
  }
  const database = SQLite.openDatabaseSync(databaseName)
  let initialized: Promise<void> | null = null
  const initialize = () => {
    initialized ??= database.execAsync(
      `CREATE TABLE IF NOT EXISTS pocketshot_media (
        id TEXT PRIMARY KEY NOT NULL,
        schema_version INTEGER NOT NULL,
        record TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    )
    return initialized
  }
  return {
    async load() {
      await initialize()
      const rows = await database.getAllAsync<{ record: string }>(
        'SELECT record FROM pocketshot_media ORDER BY updated_at ASC;',
      )
      return rows.map((row) => JSON.parse(row.record) as DurableMediaRecord)
    },
    async save(records) {
      await initialize()
      await database.execAsync('BEGIN IMMEDIATE;')
      try {
        await database.execAsync('DELETE FROM pocketshot_media;')
        for (const record of records) {
          await database.runAsync(
            `INSERT INTO pocketshot_media (id, schema_version, record, updated_at)
             VALUES (?, ?, ?, ?);`,
            [record.id, record.schemaVersion, JSON.stringify(record), record.updatedAt],
          )
        }
        await database.execAsync('COMMIT;')
      } catch (error) {
        await database.execAsync('ROLLBACK;')
        throw error
      }
    },
  }
}
