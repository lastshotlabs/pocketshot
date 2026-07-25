import type { z } from 'zod'

export type DraftHealth = 'healthy' | 'unsaved' | 'saving' | 'offline' | 'error' | 'conflict'

export interface DraftVersion<T> {
  id: string
  createdAt: string
  source: 'local' | 'server' | 'restore'
  value: T
  serverVersion: string | null
}

export interface DraftConflict<T> {
  base: T
  local: T
  remote: T
  remoteVersion: string
  detectedAt: string
}

export interface DurableDraftRecord<T> {
  schemaVersion: 1
  id: string
  value: T
  baseValue: T
  serverVersion: string | null
  revision: number
  savedRevision: number
  updatedAt: string
  lastSavedAt: string | null
  lastError: string | null
  health: DraftHealth
  conflict: DraftConflict<T> | null
  undo: T[]
  redo: T[]
  history: DraftVersion<T>[]
}

export interface DraftStorage {
  load<T>(id: string): Promise<DurableDraftRecord<T> | null>
  save<T>(record: DurableDraftRecord<T>): Promise<void>
  remove(id: string): Promise<void>
}

export interface SaveDraftInput<T> {
  id: string
  value: T
  expectedVersion: string | null
  idempotencyKey: string
}

export interface SaveDraftResult<T> {
  value: T
  version: string
}

export interface DurableDraftOptions<T> {
  id: string
  initialValue: T
  initialServerVersion?: string | null
  storage: DraftStorage
  publishSchema: z.ZodType<T>
  saveRemote: (input: SaveDraftInput<T>) => Promise<SaveDraftResult<T>>
  autosaveMs?: number
  maxUndo?: number
  maxHistory?: number
  now?: () => Date
  clone?: (value: T) => T
  isOfflineError?: (error: unknown) => boolean
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void
}

export interface DurableDraftSnapshot<T> {
  id: string
  value: T
  serverVersion: string | null
  revision: number
  isDirty: boolean
  isSaving: boolean
  publishBlocks: string[]
  canPublish: boolean
  health: DraftHealth
  conflict: DraftConflict<T> | null
  lastSavedAt: string | null
  lastError: string | null
  canUndo: boolean
  canRedo: boolean
  history: DraftVersion<T>[]
}

export type DraftListener = () => void
