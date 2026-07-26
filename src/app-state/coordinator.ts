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
    this.tasks.set(task.id, task)
    return () => this.tasks.delete(task.id)
  }

  subscribe(listener: (checkpoint: LifecycleCheckpoint) => void): () => void {
    this.listeners.add(listener)
    listener(this.checkpoint)
    return () => this.listeners.delete(listener)
  }

  async initialize(initialState: LifecycleState = 'active'): Promise<LifecycleCheckpoint> {
    if (this.initialized) return this.checkpoint
    const stored = await this.options.storage.get()
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
    this.initialized = true
    await this.options.storage.set(this.value)
    this.emit()
    if (stored && !stored.cleanShutdown && initialState === 'active') {
      await this.runPhase('foreground', 'process-restart', stored.state, initialState)
    }
    return this.checkpoint
  }

  transition(nextState: LifecycleState, reason: LifecycleReason = 'os-transition'): Promise<void> {
    this.queue = this.queue.then(async () => {
      if (!this.initialized) await this.initialize(this.value.state)
      const previousState = this.value.state
      if (previousState === nextState) return
      this.value.state = nextState
      if (nextState === 'active') this.value.lastActiveAt = this.now().toISOString()
      if (nextState === 'background') this.value.lastBackgroundAt = this.now().toISOString()
      const phase =
        nextState === 'active' ? 'foreground' : previousState === 'active' ? 'background' : null
      if (phase) await this.runPhase(phase, reason, previousState, nextState)
      await this.options.storage.set(this.value)
      this.emit()
    })
    return this.queue
  }

  async markCleanShutdown(): Promise<void> {
    this.value.cleanShutdown = true
    await this.options.storage.set(this.value)
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
        this.value.failures.push({ taskId: task.id, phase, message: error.message })
        this.value.failures = this.value.failures.slice(-50)
        this.options.onError?.(task.id, phase, error)
      }
    }
  }

  private emit(): void {
    const value = this.checkpoint
    for (const listener of this.listeners) listener(value)
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
