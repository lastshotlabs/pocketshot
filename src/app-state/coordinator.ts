export type LifecycleState = 'active' | 'inactive' | 'background'
export type LifecycleReason = 'os-transition' | 'process-restart' | 'manual-recovery'

export interface LifecycleCheckpoint {
  schemaVersion: 1
  processGeneration: number
  state: LifecycleState
  lastActiveAt: string | null
  lastBackgroundAt: string | null
  cleanShutdown: boolean
  failures: Array<{ taskId: string; phase: 'foreground' | 'background'; message: string }>
}

export interface LifecycleStorage {
  get(): Promise<LifecycleCheckpoint | null>
  set(value: LifecycleCheckpoint): Promise<void>
  clear(): Promise<void>
}

export interface LifecycleTaskContext {
  reason: LifecycleReason
  previousState: LifecycleState
  nextState: LifecycleState
  processGeneration: number
}

export interface LifecycleTask {
  id: string
  order?: number
  timeoutMs?: number
  foreground?(context: LifecycleTaskContext): Promise<void> | void
  background?(context: LifecycleTaskContext): Promise<void> | void
}

export interface LifecycleCoordinatorOptions {
  storage: LifecycleStorage
  now?: () => Date
  timeout?: <T>(operation: Promise<T>, milliseconds: number) => Promise<T>
  onError?(taskId: string, phase: 'foreground' | 'background', error: Error): void
  /** Converts task failures into bounded, privacy-safe persisted diagnostics. */
  sanitizeError?(error: unknown): string
}

const clone = <T>(value: T): T => structuredClone(value)

export class LifecycleCoordinator {
  private value: LifecycleCheckpoint = {
    schemaVersion: 1,
    processGeneration: 0,
    state: 'active',
    lastActiveAt: null,
    lastBackgroundAt: null,
    cleanShutdown: false,
    failures: [],
  }
  private readonly tasks = new Map<string, LifecycleTask>()
  private readonly listeners = new Set<(checkpoint: LifecycleCheckpoint) => void>()
  private queue: Promise<void> = Promise.resolve()
  private initialized = false
  private initializePromise: Promise<LifecycleCheckpoint> | null = null
  private readonly now: () => Date
  private readonly timeout: NonNullable<LifecycleCoordinatorOptions['timeout']>

  constructor(private readonly options: LifecycleCoordinatorOptions) {
    this.now = options.now ?? (() => new Date())
    this.timeout = options.timeout ?? withTimeout
  }

  get checkpoint(): LifecycleCheckpoint {
    return clone(this.value)
  }

  register(task: LifecycleTask): () => void {
    if (!task.id.trim()) throw new Error('[pocketshot] Lifecycle task id is required')
    if (this.tasks.has(task.id))
      throw new Error(`[pocketshot] Duplicate lifecycle task: ${task.id}`)
    if (
      (task.order !== undefined && !Number.isFinite(task.order)) ||
      (task.timeoutMs !== undefined &&
        (!Number.isFinite(task.timeoutMs) || task.timeoutMs <= 0))
    ) {
      throw new RangeError('[pocketshot] Lifecycle task order/timeout is invalid')
    }
    this.tasks.set(task.id, task)
    return () => this.tasks.delete(task.id)
  }

  subscribe(listener: (checkpoint: LifecycleCheckpoint) => void): () => void {
    this.listeners.add(listener)
    try {
      listener(this.checkpoint)
    } catch {
      // Subscription setup follows the same observer-isolation rule as updates.
    }
    return () => this.listeners.delete(listener)
  }

  async initialize(initialState: LifecycleState = 'active'): Promise<LifecycleCheckpoint> {
    if (this.initialized) return this.checkpoint
    this.initializePromise ??= this.performInitialize(initialState).finally(() => {
      this.initializePromise = null
    })
    return this.initializePromise
  }

  private async performInitialize(initialState: LifecycleState): Promise<LifecycleCheckpoint> {
    const loaded = await this.options.storage.get()
    const stored = isCheckpoint(loaded) ? loaded : null
    if (loaded && !stored) await this.options.storage.clear()
    this.value = stored
      ? {
          ...clone(stored),
          processGeneration: stored.processGeneration + 1,
          state: initialState,
          cleanShutdown: false,
          failures: [],
        }
      : {
          ...this.value,
          processGeneration: 1,
          state: initialState,
          lastActiveAt: initialState === 'active' ? this.now().toISOString() : null,
        }
    await this.options.storage.set(this.value)
    if (stored && !stored.cleanShutdown && initialState === 'active') {
      await this.runPhase('foreground', 'process-restart', stored.state, initialState)
      await this.options.storage.set(this.value)
    }
    this.initialized = true
    this.emit()
    return this.checkpoint
  }

  transition(nextState: LifecycleState, reason: LifecycleReason = 'os-transition'): Promise<void> {
    this.queue = this.queue.catch(() => undefined).then(async () => {
      if (!this.initialized) await this.initialize(this.value.state)
      const previousState = this.value.state
      if (previousState === nextState) return
      const previousCheckpoint = clone(this.value)
      this.value.state = nextState
      if (nextState === 'active') this.value.lastActiveAt = this.now().toISOString()
      if (nextState === 'background') this.value.lastBackgroundAt = this.now().toISOString()
      const phase =
        nextState === 'active' ? 'foreground' : previousState === 'active' ? 'background' : null
      try {
        if (phase) await this.runPhase(phase, reason, previousState, nextState)
        await this.options.storage.set(this.value)
        this.emit()
      } catch (error) {
        this.value = previousCheckpoint
        throw error
      }
    })
    return this.queue
  }

  async markCleanShutdown(): Promise<void> {
    await this.queue.catch(() => undefined)
    if (!this.initialized) await this.initialize(this.value.state)
    const previous = this.value.cleanShutdown
    this.value.cleanShutdown = true
    try {
      await this.options.storage.set(this.value)
    } catch (error) {
      this.value.cleanShutdown = previous
      throw error
    }
    this.emit()
  }

  async clear(): Promise<void> {
    this.tasks.clear()
    this.listeners.clear()
    this.initialized = false
    await this.options.storage.clear()
  }

  private async runPhase(
    phase: 'foreground' | 'background',
    reason: LifecycleReason,
    previousState: LifecycleState,
    nextState: LifecycleState,
  ): Promise<void> {
    const context: LifecycleTaskContext = {
      reason,
      previousState,
      nextState,
      processGeneration: this.value.processGeneration,
    }
    for (const task of [...this.tasks.values()].sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id),
    )) {
      const operation = task[phase]
      if (!operation) continue
      try {
        await this.timeout(Promise.resolve(operation(context)), task.timeoutMs ?? 5_000)
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause))
        this.value.failures.push({ taskId: task.id, phase, message: this.safeError(error) })
        this.value.failures = this.value.failures.slice(-50)
        try {
          this.options.onError?.(task.id, phase, error)
        } catch {
          // Diagnostic reporters must never interrupt lifecycle recovery.
        }
      }
    }
  }

  private emit(): void {
    const value = this.checkpoint
    for (const listener of this.listeners) {
      try {
        listener(value)
      } catch {
        // One UI observer must not starve the remaining lifecycle subscribers.
      }
    }
  }

  private safeError(error: unknown): string {
    const value = (
      this.options.sanitizeError?.(error) ??
      (error instanceof Error ? error.name : 'Lifecycle task failed')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (value || 'Lifecycle task failed').slice(0, 160)
  }
}

export function createMemoryLifecycleStorage(): LifecycleStorage {
  let value: LifecycleCheckpoint | null = null
  return {
    get: async () => (value ? clone(value) : null),
    set: async (next) => {
      value = clone(next)
    },
    clear: async () => {
      value = null
    },
  }
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`[pocketshot] Lifecycle task timed out after ${milliseconds}ms`)),
        milliseconds,
      )
    }),
  ]).finally(() => clearTimeout(timer))
}

function isCheckpoint(value: LifecycleCheckpoint | null): value is LifecycleCheckpoint {
  return Boolean(
    value &&
      value.schemaVersion === 1 &&
      Number.isInteger(value.processGeneration) &&
      value.processGeneration >= 0 &&
      ['active', 'inactive', 'background'].includes(value.state) &&
      Array.isArray(value.failures),
  )
}
