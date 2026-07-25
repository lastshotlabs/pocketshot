import { describe, expect, it, vi } from 'vitest'
import {
  createSQLiteDraftStorage,
  type SQLiteDraftDatabase,
  type SQLiteDraftModule,
} from '../../src/drafts/storage'

describe('SQLite draft storage module injection', () => {
  it('uses a statically supplied Expo SQLite module for Metro production bundles', async () => {
    let stored: string | null = null
    const database: SQLiteDraftDatabase = {
      execAsync: vi.fn(async () => undefined),
      getFirstAsync: vi.fn(async () => (stored ? { record: stored } : null) as never),
      runAsync: vi.fn(async (sql, params) => {
        if (sql.startsWith('INSERT')) stored = String(params?.[2])
        if (sql.startsWith('DELETE')) stored = null
        return undefined
      }),
    }
    const sqlite: SQLiteDraftModule = {
      openDatabaseSync: vi.fn(() => database),
    }
    const storage = createSQLiteDraftStorage('injected.db', sqlite)
    const record = {
      schemaVersion: 1 as const,
      id: 'draft-1',
      value: { title: 'Bundled' },
      baseValue: { title: 'Initial' },
      revision: 1,
      savedRevision: 0,
      serverVersion: null,
      updatedAt: '2026-07-25T00:00:00.000Z',
      lastSavedAt: null,
      lastError: null,
      health: 'healthy' as const,
      conflict: null,
      undo: [],
      redo: [],
      history: [],
    }

    await storage.save(record)
    expect(await storage.load('draft-1')).toEqual(record)
    expect(sqlite.openDatabaseSync).toHaveBeenCalledWith('injected.db')
    await storage.remove('draft-1')
    expect(await storage.load('draft-1')).toBeNull()
  })
})
