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

  get snapshot(): { records: MetricRecord[]; conflicts: MetricConflict[] } {
    return {
      records: [...this.records.values()]
        .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
        .map((record) => structuredClone(record)),
      conflicts: [...this.conflicts.values()].map((conflict) => structuredClone(conflict)),
    }
  }

  log(input: Omit<MetricRecord, 'id' | 'status'>): void {
    if (this.records.has(input.clientId)) return
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

export class WorkoutController {
  private programs = new Map<string, WorkoutProgram>()
  private sessionValue: WorkoutSession | null = null

  constructor(private readonly now: () => number = Date.now) {}

  get snapshot(): { programs: WorkoutProgram[]; session: WorkoutSession | null } {
    return {
      programs: [...this.programs.values()].map((program) => structuredClone(program)),
      session: this.sessionValue ? structuredClone(this.sessionValue) : null,
    }
  }

  saveProgram(program: WorkoutProgram): void {
    if (!program.name.trim() || program.exercises.length === 0) {
      throw new Error('Program requires a name and exercise')
    }
    this.programs.set(program.id, structuredClone(program))
  }

  start(sessionId: string, programId: string, startedAt: string): void {
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
  }

  logSet(set: WorkoutSet): void {
    const session = this.requireActive()
    const program = this.programs.get(session.programId)!
    if (!program.exercises.some((exercise) => exercise.id === set.exerciseId)) {
      throw new Error('Exercise is not part of the active program')
    }
    if (session.sets.some((candidate) => candidate.id === set.id)) return
    this.validateSet(set)
    session.sets.push(structuredClone(set))
  }

  editSet(setId: string, patch: Partial<Pick<WorkoutSet, 'reps' | 'load' | 'unit'>>): void {
    const session = this.requireActive()
    const index = session.sets.findIndex((set) => set.id === setId)
    if (index < 0) throw new Error(`Unknown workout set: ${setId}`)
    const next = { ...session.sets[index], ...structuredClone(patch) }
    this.validateSet(next)
    session.sets[index] = next
  }

  removeSet(setId: string): void {
    const session = this.requireActive()
    session.sets = session.sets.filter((set) => set.id !== setId)
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

  complete(at: string): void {
    const session = this.requireActive()
    this.sessionValue = { ...session, status: 'complete', completedAt: at }
  }

  restore(session: WorkoutSession): void {
    if (!this.programs.has(session.programId)) throw new Error('Cannot restore an unknown program')
    this.sessionValue = structuredClone(session)
  }

  private requireActive(): WorkoutSession {
    if (!this.sessionValue || this.sessionValue.status !== 'active') {
      throw new Error('No active workout')
    }
    return this.sessionValue
  }

  private validateSet(set: WorkoutSet): void {
    if (!Number.isInteger(set.reps) || set.reps < 0) {
      throw new Error('Workout reps must be a non-negative integer')
    }
    if (!Number.isFinite(set.load) || set.load < 0) {
      throw new Error('Workout load must be non-negative')
    }
  }
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

export class EntitlementController {
  private entitlements = new Map<string, StoreEntitlement>()
  private loadingValue = false
  private errorValue: string | null = null

  constructor(
    private readonly adapter: BillingAdapter,
    private readonly verifier?: EntitlementVerifier,
  ) {}

  get snapshot(): {
    entitlements: StoreEntitlement[]
    isLoading: boolean
    error: string | null
  } {
    return {
      entitlements: [...this.entitlements.values()].map((value) => structuredClone(value)),
      isLoading: this.loadingValue,
      error: this.errorValue,
    }
  }

  canAccess(productId: string): boolean {
    const state = this.entitlements.get(productId)?.state
    return state === 'active' || state === 'grace'
  }

  async purchase(productId: string): Promise<void> {
    await this.run(async () => [await this.adapter.purchase(productId)])
  }

  async restore(): Promise<void> {
    await this.run(() => this.adapter.restore())
  }

  async refresh(): Promise<void> {
    await this.run(() => this.adapter.refresh())
  }

  private async run(operation: () => Promise<StoreEntitlement[]>): Promise<void> {
    this.loadingValue = true
    this.errorValue = null
    try {
      for (const storeEntitlement of await operation()) {
        this.entitlements.set(
          storeEntitlement.productId,
          structuredClone(
            this.verifier ? { ...storeEntitlement, state: 'pending' } : storeEntitlement,
          ),
        )
        const entitlement = this.verifier
          ? await this.verifier.verify(structuredClone(storeEntitlement))
          : storeEntitlement
        if (this.verifier && entitlement.productId !== storeEntitlement.productId) {
          throw new Error('Verified entitlement product does not match the store transaction')
        }
        this.entitlements.set(entitlement.productId, structuredClone(entitlement))
      }
    } catch (error) {
      this.errorValue = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      this.loadingValue = false
    }
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
