import { DraftConflictError } from './conflict'
import type {
  DraftConflict,
  DraftListener,
  DraftVersion,
  DraftLifecycle,
  DurableDraftOptions,
  DurableDraftRecord,
  DurableDraftSnapshot,
} from './types'

const DEFAULT_MAX_DRAFT_BYTES = 5 * 1024 * 1024
const MAX_ERROR_LENGTH = 160

export class DraftCapacityError extends Error {
  constructor(readonly bytes: number, readonly maximum: number) {
    super(`Draft requires ${bytes} bytes; maximum is ${maximum}`)
    this.name = 'DraftCapacityError'
  }
}

export class DurableDraftController<T> {
  private record: DurableDraftRecord<T> | null = null
  private readonly listeners = new Set<DraftListener>()
  private initializePromise: Promise<void> | null = null
  private savePromise: Promise<void> | null = null
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private persistChain: Promise<void> = Promise.resolve()

  constructor(private readonly options: DurableDraftOptions<T>) {}

  get snapshot(): DurableDraftSnapshot<T> {
    if (!this.record) throw new Error('Draft is not initialized. Call initialize() first.')
    const validation = this.options.publishSchema.safeParse(this.record.value)
    const publishBlocks = validation.success
      ? []
      : validation.error.issues.map((issue) => issue.message)
    return {
      id: this.record.id,
      value: this.clone(this.record.value),
      serverVersion: this.record.serverVersion,
      revision: this.record.revision,
      isDirty: this.record.revision !== this.record.savedRevision,
      isSaving: this.record.health === 'saving',
      publishBlocks,
      canPublish: publishBlocks.length === 0 && !this.record.conflict,
      health: this.record.health,
      conflict: this.record.conflict ? this.cloneConflict(this.record.conflict) : null,
      lastSavedAt: this.record.lastSavedAt,
      lastError: this.record.lastError,
      canUndo: this.record.undo.length > 0,
      canRedo: this.record.redo.length > 0,
      history: this.record.history.map((version) => this.cloneVersion(version)),
    }
  }

  subscribe(listener: DraftListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  initialize(): Promise<void> {
    this.disposed = false
    if (this.record) return Promise.resolve()
    this.initializePromise ??= this.performInitialize()
      .catch((error) => {
        this.record = null
        throw error
      })
      .finally(() => {
        this.initializePromise = null
      })
    return this.initializePromise
  }

  async update(next: T | ((current: T) => T)): Promise<void> {
    await this.initialize()
    const record = this.requireRecord()
    const before = this.cloneRecord(record)
    const previous = this.clone(record.value)
    const value = typeof next === 'function' ? (next as (current: T) => T)(previous) : next
    record.undo.push(previous)
    if (record.undo.length > (this.options.maxUndo ?? 100)) record.undo.shift()
    record.redo = []
    record.value = this.clone(value)
    if (record.conflict) record.conflict.local = this.clone(record.value)
    record.revision += 1
    record.updatedAt = this.nowIso()
    record.health = record.conflict ? 'conflict' : 'unsaved'
    record.lastError = null
    this.addHistory('local')
    try {
      await this.persist()
    } catch (error) {
      this.record = before
      throw error
    }
    this.scheduleAutosave()
  }

  async undo(): Promise<boolean> {
    await this.initialize()
    const record = this.requireRecord()
    const previous = record.undo.pop()
    if (previous === undefined) return false
    record.redo.push(this.clone(record.value))
    record.value = this.clone(previous)
    if (record.conflict) record.conflict.local = this.clone(record.value)
    record.revision += 1
    record.updatedAt = this.nowIso()
    record.health = record.conflict ? 'conflict' : 'unsaved'
    await this.persist()
    this.scheduleAutosave()
    return true
  }

  async redo(): Promise<boolean> {
    await this.initialize()
    const record = this.requireRecord()
    const next = record.redo.pop()
    if (next === undefined) return false
    record.undo.push(this.clone(record.value))
    record.value = this.clone(next)
    if (record.conflict) record.conflict.local = this.clone(record.value)
    record.revision += 1
    record.updatedAt = this.nowIso()
    record.health = record.conflict ? 'conflict' : 'unsaved'
    await this.persist()
    this.scheduleAutosave()
    return true
  }

  flush(): Promise<void> {
    this.cancelAutosave()
    this.savePromise ??= this.performSave().finally(() => {
      this.savePromise = null
    })
    return this.savePromise
  }

  async resolveConflict(
    strategy: 'keep_mine' | 'use_server' | ((conflict: DraftConflict<T>) => T),
  ): Promise<void> {
    await this.initialize()
    const record = this.requireRecord()
    const conflict = record.conflict
    if (!conflict) return
    if (strategy === 'use_server') {
      record.value = this.clone(conflict.remote)
      record.baseValue = this.clone(conflict.remote)
      record.serverVersion = conflict.remoteVersion
      record.savedRevision = record.revision
      record.health = 'healthy'
    } else {
      record.value =
        strategy === 'keep_mine'
          ? this.clone(conflict.local)
          : this.clone(strategy(this.cloneConflict(conflict)))
      record.baseValue = this.clone(conflict.remote)
      record.serverVersion = conflict.remoteVersion
      record.revision += 1
      record.health = 'unsaved'
    }
    record.conflict = null
    record.lastError = null
    record.updatedAt = this.nowIso()
    this.addHistory('restore')
    await this.persist()
    if (strategy !== 'use_server') this.scheduleAutosave()
  }

  async restoreVersion(id: string): Promise<void> {
    await this.initialize()
    const version = this.requireRecord().history.find((candidate) => candidate.id === id)
    if (!version) throw new Error(`Unknown draft version: ${id}`)
    await this.update(this.clone(version.value))
    this.addHistory('restore')
    await this.persist()
  }

  async duplicate(newId: string): Promise<DurableDraftRecord<T>> {
    await this.initialize()
    if (!newId.trim()) throw new Error('Draft ID is required')
    const current = this.requireRecord()
    const now = this.nowIso()
    const duplicate: DurableDraftRecord<T> = {
      ...current,
      id: newId,
      value: this.clone(current.value),
      baseValue: this.clone(current.value),
      serverVersion: null,
      revision: 0,
      savedRevision: 0,
      updatedAt: now,
      lastSavedAt: null,
      health: 'healthy',
      conflict: null,
      undo: [],
      redo: [],
      history: [],
    }
    this.compactToCapacity(duplicate)
    this.assertCapacity(duplicate)
    await this.options.storage.save(this.cloneRecord(duplicate))
    return this.cloneRecord(duplicate)
  }

  async dispose(): Promise<void> {
    this.disposed = true
    this.cancelAutosave()
    if (this.record && this.record.revision !== this.record.savedRevision) {
      try {
        await this.flush()
      } catch {
        // The local record was already persisted by update/undo/redo.
      }
    }
    this.listeners.clear()
  }

  private async performInitialize(): Promise<void> {
    const stored = await this.options.storage.load<T>(this.options.id)
    if (stored) {
      if (stored.schemaVersion !== 1) {
        throw new Error(`Unsupported draft schema version: ${stored.schemaVersion}`)
      }
      this.record = stored
    } else {
      const now = this.nowIso()
      this.record = {
        schemaVersion: 1,
        id: this.options.id,
        value: this.clone(this.options.initialValue),
        baseValue: this.clone(this.options.initialValue),
        serverVersion: this.options.initialServerVersion ?? null,
        revision: 0,
        savedRevision: 0,
        updatedAt: now,
        lastSavedAt: null,
        lastError: null,
        health: 'healthy',
        conflict: null,
        undo: [],
        redo: [],
        history: [],
      }
      await this.persist()
    }
    this.emit()
  }

  private async performSave(): Promise<void> {
    await this.initialize()
    const record = this.requireRecord()
    if (record.conflict || record.revision === record.savedRevision) return
    const revision = record.revision
    const value = this.clone(record.value)
    const expectedVersion = record.serverVersion
    record.health = 'saving'
    record.lastError = null
    await this.persist()
    try {
      const result = await this.options.saveRemote({
        id: record.id,
        value,
        expectedVersion,
        idempotencyKey: `${record.id}:${revision}`,
      })
      record.baseValue = this.clone(result.value)
      if (record.revision === revision) record.value = this.clone(result.value)
      record.serverVersion = result.version
      record.savedRevision = revision
      record.lastSavedAt = this.nowIso()
      record.lastError = null
      record.health = record.revision === revision ? 'healthy' : 'unsaved'
      this.addHistory('server', result.value)
      await this.persist()
      if (record.revision !== revision) this.scheduleAutosave()
    } catch (error) {
      if (error instanceof DraftConflictError) {
        record.conflict = {
          base: this.clone(record.baseValue),
          local: this.clone(record.value),
          remote: this.clone(error.remoteValue),
          remoteVersion: error.remoteVersion,
          detectedAt: this.nowIso(),
        }
        record.health = 'conflict'
      } else {
        record.health = this.options.isOfflineError?.(error) ? 'offline' : 'error'
      }
      record.lastError = this.safeError(error)
      await this.persist()
      throw error
    }
  }

  private scheduleAutosave(): void {
    this.cancelAutosave()
    if (this.disposed) return
    this.autosaveTimer = (this.options.setTimer ?? setTimeout)(() => {
      this.autosaveTimer = null
      void this.flush().catch(() => undefined)
    }, this.options.autosaveMs ?? 1_000)
  }

  private cancelAutosave(): void {
    if (this.autosaveTimer) (this.options.clearTimer ?? clearTimeout)(this.autosaveTimer)
    this.autosaveTimer = null
  }

  private addHistory(source: DraftVersion<T>['source'], value?: T): void {
    const record = this.requireRecord()
    record.history.push({
      id: `${record.revision}:${record.history.length}:${this.nowIso()}`,
      createdAt: this.nowIso(),
      source,
      value: this.clone(value ?? record.value),
      serverVersion: record.serverVersion,
    })
    const max = this.options.maxHistory ?? 50
    if (record.history.length > max) record.history.splice(0, record.history.length - max)
  }

  private async persist(): Promise<void> {
    this.compactToCapacity(this.requireRecord())
    const snapshot = this.cloneRecord(this.requireRecord())
    this.assertCapacity(snapshot)
    const save = this.persistChain.then(() => this.options.storage.save(snapshot))
    this.persistChain = save.catch(() => undefined)
    await save
    this.emit()
  }

  private requireRecord(): DurableDraftRecord<T> {
    if (!this.record) throw new Error('Draft is not initialized')
    return this.record
  }

  private clone(value: T): T {
    return (this.options.clone ?? defaultClone)(value)
  }

  private cloneConflict(conflict: DraftConflict<T>): DraftConflict<T> {
    return {
      ...conflict,
      base: this.clone(conflict.base),
      local: this.clone(conflict.local),
      remote: this.clone(conflict.remote),
    }
  }

  private cloneVersion(version: DraftVersion<T>): DraftVersion<T> {
    return { ...version, value: this.clone(version.value) }
  }

  private cloneRecord(record: DurableDraftRecord<T>): DurableDraftRecord<T> {
    return defaultClone(record)
  }

  private assertCapacity(record: DurableDraftRecord<T>): void {
    const bytes = this.recordBytes(record)
    const maximum = this.options.maxBytes ?? DEFAULT_MAX_DRAFT_BYTES
    if (bytes > maximum) throw new DraftCapacityError(bytes, maximum)
  }

  private compactToCapacity(record: DurableDraftRecord<T>): void {
    const maximum = this.options.maxBytes ?? DEFAULT_MAX_DRAFT_BYTES
    while (this.recordBytes(record) > maximum && record.history.length > 0) {
      record.history.shift()
    }
    while (this.recordBytes(record) > maximum && record.undo.length > 0) {
      record.undo.shift()
    }
    while (this.recordBytes(record) > maximum && record.redo.length > 0) {
      record.redo.shift()
    }
  }

  private recordBytes(record: DurableDraftRecord<T>): number {
    const serialized = JSON.stringify(record)
    if (serialized === undefined) throw new TypeError('Draft must be JSON serializable')
    return new TextEncoder().encode(serialized).byteLength
  }

  private safeError(error: unknown): string {
    const sanitized = (
      this.options.sanitizeError?.(error) ??
      (error instanceof DraftConflictError
        ? 'Draft conflict'
        : error instanceof Error
          ? error.name
          : 'Draft save failed')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (sanitized || 'Draft save failed').slice(0, MAX_ERROR_LENGTH)
  }

  private nowIso(): string {
    return (this.options.now ?? (() => new Date()))().toISOString()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

function defaultClone<T>(value: T): T {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value)) as T
}

export function createDurableDraft<T>(options: DurableDraftOptions<T>): DurableDraftController<T> {
  return new DurableDraftController(options)
}

export function bindDraftLifecycle<T>(
  controller: DurableDraftController<T>,
  appStateManager: DraftLifecycle,
): () => void {
  return appStateManager.onBackground(() => {
    void controller.flush().catch(() => undefined)
  })
}
