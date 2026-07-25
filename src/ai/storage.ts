import type { AiConversation, AiConversationStorage } from './types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function createMemoryAiStorage(initial: AiConversation[] = []): AiConversationStorage {
  let conversations = clone(initial)
  return {
    load: async () => clone(conversations),
    save: async (next) => {
      conversations = clone(next)
    },
  }
}

interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>
  getAllAsync<T>(sql: string): Promise<T[]>
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
}

export function createSQLiteAiStorage(databaseName = 'pocketshot_ai.db'): AiConversationStorage {
  let SQLite: { openDatabaseSync(name: string): SQLiteDatabase }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SQLite = require('expo-sqlite') as typeof SQLite
  } catch {
    throw new Error(
      '[pocketshot] Durable AI conversations require expo-sqlite.\n' +
        'Install it: npx expo install expo-sqlite',
    )
  }
  const database = SQLite.openDatabaseSync(databaseName)
  let initialized: Promise<void> | null = null
  const initialize = () => {
    initialized ??= database.execAsync(
      `CREATE TABLE IF NOT EXISTS pocketshot_ai_conversations (
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
        'SELECT record FROM pocketshot_ai_conversations ORDER BY updated_at DESC;',
      )
      return rows.map((row) => JSON.parse(row.record) as AiConversation)
    },
    async save(conversations) {
      await initialize()
      await database.execAsync('BEGIN IMMEDIATE;')
      try {
        await database.execAsync('DELETE FROM pocketshot_ai_conversations;')
        for (const conversation of conversations) {
          await database.runAsync(
            `INSERT INTO pocketshot_ai_conversations (id, schema_version, record, updated_at)
             VALUES (?, ?, ?, ?);`,
            [
              conversation.id,
              conversation.schemaVersion,
              JSON.stringify(conversation),
              conversation.updatedAt,
            ],
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
