export type MeasurementUnit = 'kg' | 'lb' | 'cm' | 'in' | 'count' | 'minutes'

export interface MetricRecord {
  id: string
  clientId: string
  kind: string
  value: number
  unit: MeasurementUnit
  recordedAt: string
  status: 'pending' | 'synced' | 'conflict'
}

export interface MetricConflict {
  clientId: string
  local: MetricRecord
  remote: MetricRecord
}

export class MetricLogController {
  private records = new Map<string, MetricRecord>()
  private conflicts = new Map<string, MetricConflict>()

  constructor(private readonly capacity = 10_000) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('Metric capacity must be a positive integer')
    }
  }

  get snapshot(): { records: MetricRecord[]; conflicts: MetricConflict[] } {
    return {
      records: [...this.records.values()]
        .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
        .map((record) => structuredClone(record)),
      conflicts: [...this.conflicts.values()].map((conflict) => structuredClone(conflict)),
    }
  }

  log(input: Omit<MetricRecord, 'id' | 'status'>): void {
    validateMetric(input)
    if (this.records.has(input.clientId)) return
    if (this.records.size >= this.capacity) throw new Error('Metric capacity exceeded')
    this.records.set(input.clientId, {
      ...structuredClone(input),
      id: input.clientId,
      status: 'pending',
    })
  }

  acknowledge(clientId: string, server: Omit<MetricRecord, 'clientId' | 'status'>): void {
    const local = this.records.get(clientId)
    if (!local) return
    const remote: MetricRecord = {
      ...structuredClone(server),
      clientId,
      status: 'synced',
    }
    validateMetric(remote)
    if (
      local.kind !== remote.kind ||
      local.value !== remote.value ||
      local.unit !== remote.unit ||
      local.recordedAt !== remote.recordedAt
    ) {
      this.records.set(clientId, { ...local, status: 'conflict' })
      this.conflicts.set(clientId, { clientId, local: structuredClone(local), remote })
      return
    }
    this.records.set(clientId, remote)
  }

  resolve(clientId: string, strategy: 'keep_local' | 'use_server'): void {
    const conflict = this.conflicts.get(clientId)
    if (!conflict) return
    this.records.set(
      clientId,
      strategy === 'keep_local'
        ? { ...conflict.local, status: 'pending' }
        : { ...conflict.remote, status: 'synced' },
    )
    this.conflicts.delete(clientId)
  }

  chart(kind: string, unit: MeasurementUnit): { at: string; value: number }[] {
    return this.snapshot.records
      .filter((record) => record.kind === kind && record.status !== 'conflict')
      .map((record) => ({
        at: record.recordedAt,
        value: convertMeasurement(record.value, record.unit, unit),
      }))
  }
}

export interface CoachGoal {
  id: string
  metric: string
  target: number
  unit: MeasurementUnit
  deadline: string | null
  archived: boolean
}

export class GoalController {
  private goals = new Map<string, CoachGoal>()

  get snapshot(): CoachGoal[] {
    return [...this.goals.values()].map((goal) => structuredClone(goal))
  }

  save(goal: Omit<CoachGoal, 'archived'>): void {
    if (!Number.isFinite(goal.target) || goal.target <= 0)
      throw new Error('Goal target must be positive')
    this.goals.set(goal.id, { ...structuredClone(goal), archived: false })
  }

  archive(id: string): void {
    const goal = this.goals.get(id)
    if (goal) this.goals.set(id, { ...goal, archived: true })
  }

  progress(id: string, current: number, currentUnit: MeasurementUnit): number {
    const goal = this.goals.get(id)
    if (!goal) throw new Error(`Unknown goal: ${id}`)
    const normalized = convertMeasurement(current, currentUnit, goal.unit)
    return Math.max(0, Math.min(1, normalized / goal.target))
  }
}

export interface ProgramExercise {
  id: string
  name: string
  targetSets: number
  targetReps: number
}

export interface WorkoutProgram {
  id: string
  name: string
  exercises: ProgramExercise[]
}

export interface WorkoutSet {
  id: string
  exerciseId: string
  reps: number
  load: number
  unit: 'kg' | 'lb'
  completedAt: string
}

export interface WorkoutSession {
  id: string
  programId: string
  status: 'active' | 'complete'
  startedAt: string
  completedAt: string | null
  sets: WorkoutSet[]
  rest?: {
    deadline: number | null
    pausedRemainingMs: number | null
    completed: boolean
  } | null
}

export interface WorkoutSyncSnapshot {
  status: 'synced' | 'pending' | 'failed' | 'conflict'
  pendingMutationIds: string[]
  conflict: {
    serverSession: WorkoutSession
    reason: string
  } | null
  error: string | null
}

export class WorkoutController {
  private programs = new Map<string, WorkoutProgram>()
  private sessionValue: WorkoutSession | null = null
  private pendingMutationIds = new Set<string>()
  private conflictValue: WorkoutSyncSnapshot['conflict'] = null
  private syncError: string | null = null

  constructor(
    private readonly now: () => number = Date.now,
    private readonly limits = { programs: 100, exercisesPerProgram: 100, setsPerSession: 2_000 },
  ) {
    for (const value of Object.values(limits)) {
      if (!Number.isInteger(value) || value < 1) throw new Error('Workout limits must be positive')
    }
  }

  get snapshot(): {
    programs: WorkoutProgram[]
    session: WorkoutSession | null
    sync: WorkoutSyncSnapshot
  } {
    return {
      programs: [...this.programs.values()].map((program) => structuredClone(program)),
      session: this.sessionValue ? structuredClone(this.sessionValue) : null,
      sync: {
        status: this.conflictValue
          ? 'conflict'
          : this.syncError
            ? 'failed'
            : this.pendingMutationIds.size
              ? 'pending'
              : 'synced',
        pendingMutationIds: [...this.pendingMutationIds],
        conflict: this.conflictValue ? structuredClone(this.conflictValue) : null,
        error: this.syncError,
      },
    }
  }

  saveProgram(program: WorkoutProgram): void {
    if (
      !program.id.trim() ||
      !program.name.trim() ||
      program.exercises.length === 0 ||
      program.exercises.length > this.limits.exercisesPerProgram
    ) {
      throw new Error('Program requires a name and exercise')
    }
    if (!this.programs.has(program.id) && this.programs.size >= this.limits.programs) {
      throw new Error('Workout program capacity exceeded')
    }
    const exerciseIds = new Set<string>()
    for (const exercise of program.exercises) {
      if (
        !exercise.id.trim() ||
        !exercise.name.trim() ||
        !Number.isInteger(exercise.targetSets) ||
        exercise.targetSets < 1 ||
        !Number.isInteger(exercise.targetReps) ||
        exercise.targetReps < 1 ||
        exerciseIds.has(exercise.id)
      ) {
        throw new Error('Program exercise is invalid')
      }
      exerciseIds.add(exercise.id)
    }
    this.programs.set(program.id, structuredClone(program))
  }

  start(sessionId: string, programId: string, startedAt: string): void {
    if (!sessionId.trim() || !isTimestamp(startedAt)) throw new Error('Workout session is invalid')
    if (!this.programs.has(programId)) throw new Error(`Unknown program: ${programId}`)
    if (this.sessionValue?.status === 'active') throw new Error('A workout is already active')
    this.sessionValue = {
      id: sessionId,
      programId,
      status: 'active',
      startedAt,
      completedAt: null,
      sets: [],
      rest: null,
    }
    this.stage(`start:${sessionId}`)
  }

  logSet(set: WorkoutSet): void {
    const session = this.requireActive()
    const program = this.programs.get(session.programId)!
    if (!program.exercises.some((exercise) => exercise.id === set.exerciseId)) {
      throw new Error('Exercise is not part of the active program')
    }
    if (session.sets.some((candidate) => candidate.id === set.id)) return
    if (session.sets.length >= this.limits.setsPerSession) {
      throw new Error('Workout set capacity exceeded')
    }
    this.validateSet(set)
    session.sets.push(structuredClone(set))
    this.stage(`set:${set.id}`)
  }

  editSet(setId: string, patch: Partial<Pick<WorkoutSet, 'reps' | 'load' | 'unit'>>): void {
    const session = this.requireActive()
    const index = session.sets.findIndex((set) => set.id === setId)
    if (index < 0) throw new Error(`Unknown workout set: ${setId}`)
    const next = { ...session.sets[index], ...structuredClone(patch) }
    this.validateSet(next)
    session.sets[index] = next
    this.stage(`set:${setId}`)
  }

  removeSet(setId: string): void {
    const session = this.requireActive()
    session.sets = session.sets.filter((set) => set.id !== setId)
    this.stage(`remove-set:${setId}`)
  }

  startRest(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('Rest duration must be positive')
    }
    const session = this.requireActive()
    session.rest = {
      deadline: this.now() + durationMs,
      pausedRemainingMs: null,
      completed: false,
    }
  }

  restRemainingMs(): number {
    const rest = this.requireActive().rest
    if (!rest || rest.completed) return 0
    if (rest.pausedRemainingMs !== null) return rest.pausedRemainingMs
    return Math.max(0, (rest.deadline ?? this.now()) - this.now())
  }

  pauseRest(): void {
    const rest = this.requireActive().rest
    if (!rest || rest.completed || rest.pausedRemainingMs !== null) return
    rest.pausedRemainingMs = this.restRemainingMs()
    rest.deadline = null
  }

  resumeRest(): void {
    const rest = this.requireActive().rest
    if (!rest || rest.completed || rest.pausedRemainingMs === null) return
    rest.deadline = this.now() + rest.pausedRemainingMs
    rest.pausedRemainingMs = null
  }

  reconcileRest(): boolean {
    const rest = this.requireActive().rest
    if (!rest || rest.completed || rest.pausedRemainingMs !== null || this.restRemainingMs() > 0) {
      return false
    }
    rest.completed = true
    rest.deadline = null
    return true
  }

  completeRest(): void {
    const rest = this.requireActive().rest
    if (!rest || rest.completed) return
    rest.completed = true
    rest.deadline = null
    rest.pausedRemainingMs = null
  }

  complete(at: string): void {
    if (!isTimestamp(at)) throw new Error('Workout completion timestamp is invalid')
    const session = this.requireActive()
    this.sessionValue = { ...session, status: 'complete', completedAt: at }
    this.stage(`complete:${session.id}`)
  }

  restore(session: WorkoutSession): void {
    if (!this.programs.has(session.programId)) throw new Error('Cannot restore an unknown program')
    this.validateSession(session)
    this.sessionValue = structuredClone(session)
  }

  acknowledgeMutation(mutationId: string): void {
    this.pendingMutationIds.delete(mutationId)
    if (this.pendingMutationIds.size === 0) this.syncError = null
  }

  failSync(message: string): void {
    if (!message.trim()) throw new Error('Sync failure requires a message')
    this.syncError = safeCoachText(message)
  }

  rejectWithConflict(serverSession: WorkoutSession, reason: string): void {
    if (!this.programs.has(serverSession.programId)) {
      throw new Error('Cannot reconcile an unknown program')
    }
    if (!reason.trim()) throw new Error('Workout conflict requires a reason')
    this.validateSession(serverSession)
    this.conflictValue = { serverSession: structuredClone(serverSession), reason: safeCoachText(reason) }
    this.syncError = null
  }

  resolveConflict(strategy: 'keep-local' | 'accept-server', mutationId?: string): void {
    if (!this.conflictValue) throw new Error('No workout conflict is active')
    if (strategy === 'accept-server') {
      this.sessionValue = structuredClone(this.conflictValue.serverSession)
      this.pendingMutationIds.clear()
    } else {
      this.stage(mutationId ?? `resolve:${this.sessionValue?.id ?? 'workout'}`)
    }
    this.conflictValue = null
  }

  private requireActive(): WorkoutSession {
    if (!this.sessionValue || this.sessionValue.status !== 'active') {
      throw new Error('No active workout')
    }
    return this.sessionValue
  }

  private validateSet(set: WorkoutSet): void {
    if (!set.id.trim() || !set.exerciseId.trim() || !isTimestamp(set.completedAt)) {
      throw new Error('Workout set identity and timestamp are required')
    }
    if (!Number.isInteger(set.reps) || set.reps < 0) {
      throw new Error('Workout reps must be a non-negative integer')
    }
    if (!Number.isFinite(set.load) || set.load < 0) {
      throw new Error('Workout load must be non-negative')
    }
  }

  private validateSession(session: WorkoutSession): void {
    if (
      !session.id.trim() ||
      !isTimestamp(session.startedAt) ||
      (session.completedAt !== null && !isTimestamp(session.completedAt)) ||
      session.sets.length > this.limits.setsPerSession
    ) {
      throw new Error('Workout session is invalid')
    }
    for (const set of session.sets) this.validateSet(set)
  }

  private stage(mutationId: string): void {
    this.pendingMutationIds.add(mutationId)
    this.syncError = null
  }
}

function validateMetric(
  metric: Pick<MetricRecord, 'clientId' | 'kind' | 'value' | 'unit' | 'recordedAt'>,
): void {
  if (
    !metric.clientId.trim() ||
    !metric.kind.trim() ||
    !Number.isFinite(metric.value) ||
    !isTimestamp(metric.recordedAt) ||
    !['kg', 'lb', 'cm', 'in', 'count', 'minutes'].includes(metric.unit)
  ) {
    throw new Error('Metric record is invalid')
  }
}

function isTimestamp(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value))
}

function safeCoachText(value: string): string {
  return value
    .replace(
      /(?:bearer\s+[a-z0-9._~-]+)|(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi,
      '[REDACTED]',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

export type EntitlementState =
  | 'unknown'
  | 'inactive'
  | 'pending'
  | 'active'
  | 'grace'
  | 'expired'
  | 'revoked'

export interface StoreEntitlement {
  productId: string
  state: Exclude<EntitlementState, 'unknown'>
  expiresAt: string | null
  transactionId?: string
  verificationToken?: string
}

export interface BillingAdapter {
  purchase(productId: string): Promise<StoreEntitlement>
  restore(): Promise<StoreEntitlement[]>
  refresh(): Promise<StoreEntitlement[]>
}

export interface EntitlementVerifier {
  verify(storeEntitlement: StoreEntitlement): Promise<StoreEntitlement>
}

export interface EntitlementControllerOptions {
  now?: () => Date
  sanitizeError?: (error: unknown) => string
  /** Require server verification before granting active or grace access. */
  requireVerification?: boolean
  storage?: EntitlementStorage
  /** Required with storage to prevent cross-account entitlement reuse. */
  accountId?: string
  /** Maximum offline age for cached access after successful verification. Default: 24 hours. */
  cacheMaxAgeMs?: number
}

export interface EntitlementCache {
  schemaVersion: 1
  accountId: string
  savedAt: string
  entitlements: StoreEntitlement[]
}

export interface EntitlementStorage {
  load(accountId: string): Promise<EntitlementCache | null>
  save(cache: EntitlementCache): Promise<void>
  clear(accountId: string): Promise<void>
}

export class EntitlementController {
  private entitlements = new Map<string, StoreEntitlement>()
  private loadingValue = false
  private errorValue: string | null = null
  private operationChain: Promise<void> = Promise.resolve()
  private readonly listeners = new Set<() => void>()
  private lastRefreshedAtValue: string | null = null
  private cacheValidUntil = 0

  constructor(
    private readonly adapter: BillingAdapter,
    private readonly verifier?: EntitlementVerifier,
    private readonly options: EntitlementControllerOptions = {},
  ) {
    if (options.requireVerification && !verifier) {
      throw new Error('Production entitlement verification is required')
    }
    if (options.storage && !options.accountId?.trim()) {
      throw new Error('Account ID is required for entitlement storage')
    }
    if (
      options.cacheMaxAgeMs !== undefined &&
      (!Number.isFinite(options.cacheMaxAgeMs) || options.cacheMaxAgeMs < 0)
    ) {
      throw new RangeError('Entitlement cache age must be non-negative')
    }
  }

  get snapshot(): {
    entitlements: StoreEntitlement[]
    isLoading: boolean
    error: string | null
    lastRefreshedAt: string | null
    isCacheStale: boolean
  } {
    return {
      entitlements: [...this.entitlements.values()].map((value) => publicEntitlement(value)),
      isLoading: this.loadingValue,
      error: this.errorValue,
      lastRefreshedAt: this.lastRefreshedAtValue,
      isCacheStale: this.isCacheStale(),
    }
  }

  canAccess(productId: string): boolean {
    const entitlement = this.entitlements.get(productId)
    if (!entitlement) return false
    if (this.isCacheStale()) return false
    const state = entitlement.state
    if (
      entitlement.expiresAt &&
      (!Number.isFinite(Date.parse(entitlement.expiresAt)) ||
        Date.parse(entitlement.expiresAt) <= (this.options.now?.() ?? new Date()).getTime())
    ) {
      return false
    }
    return state === 'active' || state === 'grace'
  }

  async purchase(productId: string): Promise<void> {
    if (!productId.trim()) throw new Error('Product ID is required')
    await this.serialize(() => this.run(async () => [await this.adapter.purchase(productId)], false))
  }

  async restore(): Promise<void> {
    await this.serialize(() => this.run(() => this.adapter.restore(), true))
  }

  async refresh(): Promise<void> {
    await this.serialize(() => this.run(() => this.adapter.refresh(), true))
  }

  initialize(): Promise<void> {
    return this.serialize(async () => {
      if (!this.options.storage || !this.options.accountId) return
      const cache = await this.options.storage.load(this.options.accountId)
      if (!cache || cache.schemaVersion !== 1 || cache.accountId !== this.options.accountId) return
      if (!Number.isFinite(Date.parse(cache.savedAt))) {
        await this.options.storage.clear(this.options.accountId)
        return
      }
      const next = new Map<string, StoreEntitlement>()
      for (const entitlement of cache.entitlements) {
        validateStoreEntitlement(entitlement)
        next.set(entitlement.productId, publicEntitlement(entitlement))
      }
      this.entitlements = next
      this.lastRefreshedAtValue = cache.savedAt
      this.cacheValidUntil =
        Date.parse(cache.savedAt) + (this.options.cacheMaxAgeMs ?? 24 * 60 * 60 * 1_000)
      this.emit()
    })
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    listener()
    return () => this.listeners.delete(listener)
  }

  /** Clears account-scoped entitlements immediately during logout/account switching. */
  async reset(): Promise<void> {
    this.entitlements.clear()
    this.errorValue = null
    this.lastRefreshedAtValue = null
    this.cacheValidUntil = 0
    if (this.options.storage && this.options.accountId) {
      await this.options.storage.clear(this.options.accountId)
    }
    this.emit()
  }

  private async run(
    operation: () => Promise<StoreEntitlement[]>,
    replace: boolean,
  ): Promise<void> {
    this.loadingValue = true
    this.errorValue = null
    this.emit()
    try {
      const storeEntitlements = await operation()
      const next = replace
        ? new Map<string, StoreEntitlement>()
        : new Map(
            [...this.entitlements.entries()].map(([key, value]) => [key, structuredClone(value)]),
          )
      for (const storeEntitlement of storeEntitlements) {
        validateStoreEntitlement(storeEntitlement)
        next.set(
          storeEntitlement.productId,
          this.verifier
            ? { ...structuredClone(storeEntitlement), state: 'pending' }
            : structuredClone(storeEntitlement),
        )
      }
      this.entitlements = next
      const refreshedAt = (this.options.now?.() ?? new Date()).toISOString()
      this.lastRefreshedAtValue = refreshedAt
      this.cacheValidUntil =
        Date.parse(refreshedAt) + (this.options.cacheMaxAgeMs ?? 24 * 60 * 60 * 1_000)
      await this.persist().catch((error) => {
        this.errorValue = this.safeError(error)
      })
      this.emit()
      for (const storeEntitlement of storeEntitlements) {
        const entitlement = this.verifier
          ? await this.verifier.verify(structuredClone(storeEntitlement))
          : storeEntitlement
        validateStoreEntitlement(entitlement)
        if (this.verifier && entitlement.productId !== storeEntitlement.productId) {
          throw new Error('Verified entitlement product does not match the store transaction')
        }
        if (
          this.verifier &&
          storeEntitlement.transactionId &&
          entitlement.transactionId !== storeEntitlement.transactionId
        ) {
          throw new Error('Verified entitlement transaction does not match the store transaction')
        }
        next.set(entitlement.productId, structuredClone(entitlement))
      }
      this.entitlements = next
    } catch (error) {
      this.errorValue = this.safeError(error)
      throw error
    } finally {
      this.loadingValue = false
      this.emit()
    }
  }

  private serialize(operation: () => Promise<void>): Promise<void> {
    const run = this.operationChain.then(operation)
    this.operationChain = run.catch(() => undefined)
    return run
  }

  private safeError(error: unknown): string {
    const value = (
      this.options.sanitizeError?.(error) ??
      (error instanceof Error ? error.name : 'Billing operation failed')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (value || 'Billing operation failed').slice(0, 160)
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  private isCacheStale(): boolean {
    return (
      this.lastRefreshedAtValue !== null &&
      (this.options.now?.() ?? new Date()).getTime() >= this.cacheValidUntil
    )
  }

  private async persist(): Promise<void> {
    if (!this.options.storage || !this.options.accountId || !this.lastRefreshedAtValue) return
    await this.options.storage.save({
      schemaVersion: 1,
      accountId: this.options.accountId,
      savedAt: this.lastRefreshedAtValue,
      entitlements: [...this.entitlements.values()].map(publicEntitlement),
    })
  }
}

export function createMemoryEntitlementStorage(): EntitlementStorage {
  const caches = new Map<string, EntitlementCache>()
  return {
    async load(accountId) {
      const cache = caches.get(accountId)
      return cache ? structuredClone(cache) : null
    },
    async save(cache) {
      caches.set(cache.accountId, structuredClone(cache))
    },
    async clear(accountId) {
      caches.delete(accountId)
    },
  }
}

function publicEntitlement(value: StoreEntitlement): StoreEntitlement {
  const { verificationToken: _verificationToken, ...publicValue } = structuredClone(value)
  return publicValue
}

function validateStoreEntitlement(entitlement: StoreEntitlement): void {
  if (!entitlement.productId.trim()) throw new Error('Entitlement product ID is required')
  if (
    !['inactive', 'pending', 'active', 'grace', 'expired', 'revoked'].includes(
      entitlement.state,
    )
  ) {
    throw new Error('Entitlement state is invalid')
  }
  if (entitlement.expiresAt && !Number.isFinite(Date.parse(entitlement.expiresAt))) {
    throw new Error('Entitlement expiry is invalid')
  }
}

export function convertMeasurement(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to) return value
  if (from === 'kg' && to === 'lb') return value * 2.2046226218
  if (from === 'lb' && to === 'kg') return value / 2.2046226218
  if (from === 'cm' && to === 'in') return value / 2.54
  if (from === 'in' && to === 'cm') return value * 2.54
  throw new Error(`Cannot convert ${from} to ${to}`)
}
