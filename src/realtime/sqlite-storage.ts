import type { RealtimeChannelStorage } from './types'

interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
}

/**
 * Creates durable cursor storage backed by expo-sqlite.
 *
 * The native peer is resolved only when this function is called, so consumers
 * that provide another storage adapter do not need expo-sqlite installed.
 */
export function createSQLiteRealtimeStorage(
  databaseName = 'pocketshot_realtime.db',
): RealtimeChannelStorage {
  let SQLite: { openDatabaseSync(name: string): SQLiteDatabase }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SQLite = require('expo-sqlite') as typeof SQLite
  } catch {
    throw new Error(
      '[pocketshot] Durable realtime cursor storage requires expo-sqlite.\n' +
        'Install it: npx expo install expo-sqlite',
    )
  }

  const database = SQLite.openDatabaseSync(databaseName)
  let initialized: Promise<void> | null = null
  const initialize = () => {
    initialized ??= database.execAsync(
      `CREATE TABLE IF NOT EXISTS pocketshot_realtime_cursors (
        channel TEXT PRIMARY KEY NOT NULL,
        cursor INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    )
    return initialized
  }

  return {
    async loadCursor(channel): Promise<number | null> {
      await initialize()
      const row = await database.getFirstAsync<{ cursor: number }>(
        'SELECT cursor FROM pocketshot_realtime_cursors WHERE channel = ?;',
        [channel],
      )
      return row?.cursor ?? null
    },
    async saveCursor(channel, cursor): Promise<void> {
      await initialize()
      await database.runAsync(
        `INSERT INTO pocketshot_realtime_cursors (channel, cursor, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(channel) DO UPDATE SET
           cursor = excluded.cursor,
           updated_at = excluded.updated_at;`,
        [channel, cursor, new Date().toISOString()],
      )
    },
    async clearCursor(channel): Promise<void> {
      await initialize()
      await database.runAsync('DELETE FROM pocketshot_realtime_cursors WHERE channel = ?;', [
        channel,
      ])
    },
  }
}
