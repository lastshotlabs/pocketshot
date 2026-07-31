import { type AiConversation, type AiMemoryFact } from '@lastshotlabs/pocketshot/ai'
import {
  AccountAuthController,
  type AccountAuthTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'
import { type MediaCaptureAdapter } from '@lastshotlabs/pocketshot/media'
import {
  AccountDataController,
  type DeletionStatus,
  type ExportStatus,
} from '@lastshotlabs/pocketshot/privacy'
import {
  EntitlementController,
  GoalController,
  MetricLogController,
  WorkoutController,
  type WorkoutProgram,
  type WorkoutSession,
} from '@lastshotlabs/pocketshot/coach'
import {
  createCoachConversation,
  createCoachMedia,
  createCoachMemory,
  defaultCoachCapture,
} from './coach-services'

export interface CoachState {
  ready: boolean
  conversation: AiConversation | null
  logs: { id: string; value: number; undone: boolean }[]
  mediaStatus: string | null
  mediaHistory: { id: string; status: string; result: string | null }[]
  memory: AiMemoryFact[]
  memoryConsent: boolean
  exportStatus: ExportStatus
  deletionStatus: DeletionStatus
  localDataCleared: boolean
  error: string | null
  goalProgress: number
  chartPoints: number[]
  workoutStatus: 'idle' | 'active' | 'complete'
  workoutSync: 'synced' | 'pending' | 'failed' | 'conflict'
  proAccess: boolean
  entitlementStatus: 'inactive' | 'pending' | 'active' | 'grace' | 'expired' | 'revoked'
  customerPortalUrl: string | null
  accountStatus: 'anonymous' | 'verification-required' | 'authenticated' | 'error'
  accountEmail: string | null
  massUnit: 'kg' | 'lb'
  distanceUnit: 'km' | 'mi'
  timeZone: string
  activeProgramName: string | null
  restStatus: 'idle' | 'running' | 'paused' | 'complete'
  restRemainingMs: number
  lifecycle: 'active' | 'background' | 'suspended'
  connection: 'online' | 'offline' | 'reconnecting'
}

export interface CoachSnapshot {
  state: Pick<
    CoachState,
    | 'massUnit'
    | 'distanceUnit'
    | 'timeZone'
    | 'activeProgramName'
    | 'workoutStatus'
    | 'workoutSync'
    | 'restStatus'
    | 'restRemainingMs'
  >
  programs: WorkoutProgram[]
  session: WorkoutSession | null
}

export class CoachDemoController {
  private stateValue: CoachState = {
    ready: false,
    conversation: null,
    logs: [],
    mediaStatus: null,
    mediaHistory: [],
    memory: [],
    memoryConsent: false,
    exportStatus: 'idle',
    deletionStatus: 'idle',
    localDataCleared: false,
    error: null,
    goalProgress: 0,
    chartPoints: [],
    workoutStatus: 'idle',
    workoutSync: 'synced',
    proAccess: false,
    entitlementStatus: 'inactive',
    customerPortalUrl: null,
    accountStatus: 'anonymous',
    accountEmail: null,
    massUnit: 'kg',
    distanceUnit: 'km',
    timeZone: 'UTC',
    activeProgramName: null,
    restStatus: 'idle',
    restRemainingMs: 0,
    lifecycle: 'active',
    connection: 'online',
  }
  private readonly listeners = new Set<(state: CoachState) => void>()

  readonly ai = createCoachConversation({
    commit: (id, value) => {
      this.stateValue.logs.push({ id, value, undone: false })
      this.emit()
    },
    undo: (id) => {
      this.stateValue.logs = this.stateValue.logs.map((log) =>
        log.id === id ? { ...log, undone: true } : log,
      )
      this.emit()
    },
  })

  readonly media
  readonly metrics = new MetricLogController()
  readonly goals = new GoalController()
  readonly workouts: WorkoutController
  readonly billing = new EntitlementController(
    {
      purchase: async (productId) => ({
        productId,
        state: 'active',
        expiresAt: '2026-08-25',
      }),
      restore: async () => [{ productId: 'coach-pro', state: 'grace', expiresAt: '2026-07-28' }],
      refresh: async () => [{ productId: 'coach-pro', state: 'expired', expiresAt: '2026-07-20' }],
    },
    undefined,
    { now: () => new Date('2026-07-27T12:00:00.000Z') },
  )
  readonly account = createDemoAccount()
  readonly privacy = new AccountDataController(
    {
      requestExport: async () => ({ requestId: 'coach-export-1' }),
      getExport: async () => ({
        status: 'ready',
        downloadUrl: 'https://downloads.example.test/coach-export.zip',
      }),
      requestDeletion: async () => ({
        requestId: 'coach-deletion-1',
        scheduledAt: '2026-08-01T12:00:00.000Z',
      }),
      cancelDeletion: async () => undefined,
      getDeletion: async () => ({ status: 'completed' }),
      revokeAuthorization: async () => this.account.logout(),
    },
    [
      {
        name: 'coach-memory',
        clear: () => {
          this.facts.splice(0)
          this.stateValue.memory = []
        },
      },
      {
        name: 'coach-local-state',
        clear: () => {
          this.stateValue.logs = []
          this.stateValue.chartPoints = []
        },
      },
    ],
  )
  constructor(
    capture: MediaCaptureAdapter = defaultCoachCapture(),
    snapshot?: CoachSnapshot,
    now: () => number = Date.now,
  ) {
    this.media = createCoachMedia(capture)
    this.workouts = new WorkoutController(now)
    if (snapshot) {
      Object.assign(this.stateValue, structuredClone(snapshot.state))
      for (const program of snapshot.programs) this.workouts.saveProgram(program)
      if (snapshot.session) this.workouts.restore(snapshot.session)
      this.stateValue.workoutStatus = snapshot.session?.status ?? snapshot.state.workoutStatus
      this.syncWorkout()
    }
  }

  private facts: AiMemoryFact[] = []
  readonly memory = createCoachMemory(this.facts)

  get state(): CoachState {
    return JSON.parse(JSON.stringify(this.stateValue)) as CoachState
  }

  subscribe(listener: (state: CoachState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  exportSnapshot(): CoachSnapshot {
    const { programs, session } = this.workouts.snapshot
    return {
      state: {
        massUnit: this.stateValue.massUnit,
        distanceUnit: this.stateValue.distanceUnit,
        timeZone: this.stateValue.timeZone,
        activeProgramName: this.stateValue.activeProgramName,
        workoutStatus: this.stateValue.workoutStatus,
        workoutSync: this.stateValue.workoutSync,
        restStatus: this.stateValue.restStatus,
        restRemainingMs: this.stateValue.restRemainingMs,
      },
      programs,
      session,
    }
  }

  setLifecycle(lifecycle: CoachState['lifecycle']): void {
    this.stateValue.lifecycle = lifecycle
    if (lifecycle !== 'active') {
      this.stateValue.connection = 'offline'
      this.emit()
      return
    }
    this.stateValue.connection = 'reconnecting'
    if (this.workouts.snapshot.session?.status === 'active') {
      const completed = this.workouts.reconcileRest()
      this.stateValue.restRemainingMs = this.workouts.restRemainingMs()
      if (completed) this.stateValue.restStatus = 'complete'
    }
    this.emit()
    queueMicrotask(() => {
      this.stateValue.connection = 'online'
      this.emit()
    })
  }

  async initialize(): Promise<void> {
    await this.account.restore()
    this.syncAccount()
    this.stateValue.conversation = await this.ai.create('Daily coaching')
    this.stateValue.ready = true
    this.emit()
  }

  async registerDemoAccount(): Promise<void> {
    try {
      await this.account.register({
        email: 'alex@example.com',
        password: 'demo-password',
        displayName: 'Alex',
      })
    } finally {
      this.syncAccount()
    }
  }

  async verifyDemoAccount(): Promise<void> {
    try {
      await this.account.verifyEmail('123456')
    } finally {
      this.syncAccount()
    }
  }

  async signInDemoAccount(): Promise<void> {
    try {
      await this.account.login('alex@example.com', 'demo-password')
    } finally {
      this.syncAccount()
    }
  }

  async completeDemoOAuth(provider: 'apple' | 'google'): Promise<void> {
    try {
      await this.account.completeOAuth(provider, 'demo-code', `aicoach://oauth/${provider}`)
    } finally {
      this.syncAccount()
    }
  }

  async requestPasswordReset(): Promise<void> {
    try {
      await this.account.forgotPassword('alex@example.com')
    } finally {
      this.syncAccount()
    }
  }

  async completePasswordReset(): Promise<void> {
    try {
      await this.account.resetPassword('demo-reset-token', 'new-demo-password')
    } finally {
      this.syncAccount()
    }
  }

  async signOut(): Promise<void> {
    await this.account.logout()
    this.syncAccount()
  }

  async ask(message: string): Promise<void> {
    if (!this.stateValue.conversation) throw new Error('Not initialized')
    try {
      this.stateValue.conversation = await this.ai.send(this.stateValue.conversation.id, message)
      this.stateValue.error = null
    } catch (error) {
      this.stateValue.error = error instanceof Error ? error.message : String(error)
    }
    this.emit()
  }

  async stopAdvice(): Promise<void> {
    const conversation = this.stateValue.conversation
    if (!conversation) return
    await this.ai.stop(conversation.id)
    this.stateValue.conversation = this.ai.get(conversation.id)
    this.emit()
  }

  async retryAdvice(): Promise<void> {
    const conversation = this.stateValue.conversation
    if (!conversation) return
    try {
      this.stateValue.conversation = await this.ai.retry(conversation.id)
      this.stateValue.error = null
    } catch (error) {
      this.stateValue.error = error instanceof Error ? error.message : String(error)
    }
    this.emit()
  }

  async confirmLatestAction(value = 8): Promise<void> {
    const conversation = this.stateValue.conversation!
    const action = conversation.messages[conversation.messages.length - 1]?.actions[0]
    if (!action) return
    await this.ai.confirmAction(conversation.id, action.id, { value })
    this.stateValue.conversation = this.ai.get(conversation.id)
    this.emit()
  }

  async undoLatestAction(): Promise<void> {
    const conversation = this.stateValue.conversation!
    const action = conversation.messages[conversation.messages.length - 1]?.actions[0]
    if (!action) return
    await this.ai.undoAction(conversation.id, action.id)
    this.stateValue.conversation = this.ai.get(conversation.id)
    this.emit()
  }

  async analyzePhoto(): Promise<void> {
    const media = await this.media.acquire('camera')
    if (!media) return
    this.stateValue.mediaStatus = 'uploading'
    this.emit()
    const result = await this.media.run(media.id)
    this.stateValue.mediaStatus =
      result.status === 'complete' ? 'Balanced meal · analysis complete' : result.status
    this.syncMediaHistory()
    this.emit()
  }

  async retryLatestPhoto(): Promise<void> {
    const latest = this.media.list().at(-1)
    if (!latest) return
    this.stateValue.mediaStatus = 'retrying'
    this.emit()
    const result = await this.media.retry(latest.id)
    this.stateValue.mediaStatus =
      result.status === 'complete' ? 'Balanced meal · analysis complete' : result.status
    this.syncMediaHistory()
    this.emit()
  }

  async cancelLatestPhoto(): Promise<void> {
    const latest = this.media.list().at(-1)
    if (!latest) return
    await this.media.cancel(latest.id)
    this.stateValue.mediaStatus = 'cancelled'
    this.syncMediaHistory()
    this.emit()
  }

  async deletePhoto(id: string): Promise<void> {
    await this.media.remove(id)
    this.syncMediaHistory()
    this.stateValue.mediaStatus = this.stateValue.mediaHistory.length
      ? this.stateValue.mediaStatus
      : 'No analysis yet.'
    this.emit()
  }

  async remember(content: string): Promise<void> {
    if (!this.stateValue.memoryConsent) {
      throw new Error('Memory consent is required before saving a fact')
    }
    await this.memory.create({ content, trusted: true, source: 'user' })
    this.stateValue.memory = this.memory.list()
    this.emit()
  }

  setMemoryConsent(consented: boolean): void {
    this.stateValue.memoryConsent = consented
    this.emit()
  }

  async editMemory(id: string, content: string): Promise<void> {
    await this.memory.update(id, { content })
    this.stateValue.memory = this.memory.list()
    this.emit()
  }

  async deleteMemory(id: string): Promise<void> {
    await this.memory.remove(id)
    this.stateValue.memory = this.memory.list()
    this.emit()
  }

  logWeight(clientId: string, value: number): void {
    if (this.metrics.snapshot.records.some((record) => record.clientId === clientId)) return
    const recordedAt = `2026-07-${String(this.metrics.snapshot.records.length + 20).padStart(2, '0')}`
    this.metrics.log({ clientId, kind: 'weight', value, unit: 'kg', recordedAt })
    this.metrics.acknowledge(clientId, {
      id: `weight-${clientId}`,
      kind: 'weight',
      value,
      unit: 'kg',
      recordedAt,
    })
    this.stateValue.chartPoints = this.metrics.chart('weight', 'kg').map((point) => point.value)
    this.emit()
  }

  setWeightGoal(targetKg: number): void {
    this.goals.save({
      id: 'weight-goal',
      metric: 'weight',
      target: targetKg,
      unit: 'kg',
      deadline: null,
    })
    const current = this.metrics.snapshot.records.at(-1)?.value ?? 0
    this.stateValue.goalProgress = this.goals.progress('weight-goal', current, 'kg')
    this.emit()
  }

  updatePreferences(input: {
    massUnit: 'kg' | 'lb'
    distanceUnit: 'km' | 'mi'
    timeZone: string
  }): void {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: input.timeZone }).format()
    } catch {
      throw new Error('Time zone is invalid')
    }
    this.stateValue.massUnit = input.massUnit
    this.stateValue.distanceUnit = input.distanceUnit
    this.stateValue.timeZone = input.timeZone
    this.emit()
  }

  buildWorkoutProgram(name = 'Progressive strength'): void {
    this.workouts.saveProgram({
      id: 'custom',
      name,
      exercises: [
        { id: 'squat', name: 'Squat', targetSets: 3, targetReps: 5 },
        { id: 'press', name: 'Press', targetSets: 3, targetReps: 8 },
      ],
    })
    this.stateValue.activeProgramName = name
    this.emit()
  }

  startWorkout(): void {
    if (!this.workouts.snapshot.programs.some((program) => program.id === 'custom')) {
      this.buildWorkoutProgram('Starter strength')
    }
    this.workouts.start('workout-1', 'custom', '2026-07-25T12:00:00.000Z')
    this.stateValue.workoutStatus = 'active'
    this.syncWorkout()
    this.emit()
  }

  logWorkoutSet(): void {
    this.workouts.logSet({
      id: 'set-1',
      exerciseId: 'squat',
      reps: 5,
      load: 40,
      unit: 'kg',
      completedAt: '2026-07-25T12:05:00.000Z',
    })
    this.syncWorkout()
    this.emit()
  }

  editWorkoutSet(reps: number, load: number, unit: 'kg' | 'lb' = this.stateValue.massUnit): void {
    const set = this.workouts.snapshot.session?.sets[0]
    if (!set) throw new Error('Log a set before editing it')
    this.workouts.editSet(set.id, { reps, load, unit })
    this.syncWorkout()
    this.emit()
  }

  removeWorkoutSet(): void {
    const set = this.workouts.snapshot.session?.sets[0]
    if (!set) return
    this.workouts.removeSet(set.id)
    this.syncWorkout()
    this.emit()
  }

  startRest(durationMs = 90_000): void {
    this.workouts.startRest(durationMs)
    this.stateValue.restStatus = 'running'
    this.stateValue.restRemainingMs = this.workouts.restRemainingMs()
    this.emit()
  }

  pauseRest(): void {
    this.workouts.pauseRest()
    this.stateValue.restStatus = 'paused'
    this.stateValue.restRemainingMs = this.workouts.restRemainingMs()
    this.emit()
  }

  resumeRest(): void {
    this.workouts.resumeRest()
    this.stateValue.restStatus = 'running'
    this.stateValue.restRemainingMs = this.workouts.restRemainingMs()
    this.emit()
  }

  completeRest(): void {
    this.workouts.completeRest()
    this.stateValue.restStatus = 'complete'
    this.stateValue.restRemainingMs = 0
    this.emit()
  }

  completeWorkout(): void {
    this.workouts.complete('2026-07-25T12:30:00.000Z')
    this.stateValue.workoutStatus = 'complete'
    this.syncWorkout()
    this.emit()
  }

  simulateWorkoutSyncConflict(): void {
    const session = this.workouts.snapshot.session
    if (!session) return
    this.workouts.rejectWithConflict(
      { ...session, sets: [], status: 'active', completedAt: null },
      'Workout changed on another device',
    )
    this.syncWorkout()
    this.emit()
  }

  resolveWorkoutConflict(strategy: 'keep-local' | 'accept-server'): void {
    this.workouts.resolveConflict(strategy, 'resolve:workout-1:v2')
    this.stateValue.workoutStatus = this.workouts.snapshot.session?.status ?? 'idle'
    this.syncWorkout()
    this.emit()
  }

  acknowledgeWorkoutSync(): void {
    for (const mutationId of this.workouts.snapshot.sync.pendingMutationIds) {
      this.workouts.acknowledgeMutation(mutationId)
    }
    this.syncWorkout()
    this.emit()
  }

  async purchasePro(): Promise<void> {
    await this.billing.purchase('coach-pro')
    this.syncEntitlement()
    this.emit()
  }

  async restorePro(): Promise<void> {
    await this.billing.restore()
    this.syncEntitlement()
    this.emit()
  }

  async refreshPro(): Promise<void> {
    await this.billing.refresh()
    this.syncEntitlement()
    this.emit()
  }

  openCustomerPortal(): string {
    const url = 'https://billing.example.test/customer-portal'
    this.stateValue.customerPortalUrl = url
    this.emit()
    return url
  }

  async requestExport(): Promise<void> {
    await this.privacy.requestExport()
    this.syncPrivacy()
  }

  async refreshExport(): Promise<void> {
    await this.privacy.refreshExport()
    this.syncPrivacy()
  }

  async requestDeletion(): Promise<void> {
    await this.privacy.requestDeletion()
    this.syncPrivacy()
  }

  async cancelDeletion(): Promise<void> {
    await this.privacy.cancelDeletion()
    this.syncPrivacy()
  }

  async completeDeletion(): Promise<void> {
    await this.privacy.refreshDeletion()
    this.syncPrivacy()
    this.syncAccount()
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }

  private syncAccount(): void {
    const snapshot = this.account.snapshot
    this.stateValue.accountStatus =
      snapshot.status === 'authenticated'
        ? 'authenticated'
        : snapshot.status === 'verification-required'
          ? 'verification-required'
          : snapshot.status === 'error'
            ? 'error'
            : 'anonymous'
    this.stateValue.accountEmail = snapshot.user?.email ?? snapshot.pendingEmail
    this.emit()
  }

  private syncMediaHistory(): void {
    this.stateValue.mediaHistory = this.media.list().map((record) => ({
      id: record.id,
      status: record.status,
      result:
        record.analysisResult === null
          ? null
          : typeof record.analysisResult === 'string'
            ? record.analysisResult
            : JSON.stringify(record.analysisResult),
    }))
  }

  private syncPrivacy(): void {
    const snapshot = this.privacy.snapshot
    this.stateValue.exportStatus = snapshot.exportStatus
    this.stateValue.deletionStatus = snapshot.deletionStatus
    this.stateValue.localDataCleared =
      snapshot.authorizationRevoked && snapshot.clearedStores.length === 2
    this.emit()
  }

  private syncWorkout(): void {
    this.stateValue.workoutSync = this.workouts.snapshot.sync.status
  }

  private syncEntitlement(): void {
    const entitlement = this.billing.snapshot.entitlements.find(
      (candidate) => candidate.productId === 'coach-pro',
    )
    this.stateValue.proAccess = this.billing.canAccess('coach-pro')
    this.stateValue.entitlementStatus = entitlement?.state ?? 'inactive'
  }
}

function createDemoAccount(): AccountAuthController {
  let accessToken: string | null = null
  let refreshToken: string | null = null
  const storage: TokenStorage = {
    getToken: async () => accessToken,
    setToken: async (token) => {
      accessToken = token
    },
    clearToken: async () => {
      accessToken = null
    },
    getRefreshToken: async () => refreshToken,
    setRefreshToken: async (token) => {
      refreshToken = token
    },
    clearRefreshToken: async () => {
      refreshToken = null
    },
  }
  const authenticated = {
    user: {
      id: 'coach-user',
      email: 'alex@example.com',
      emailVerified: true,
      displayName: 'Alex',
    },
    accessToken: 'local-access-token',
    refreshToken: 'local-refresh-token',
  }
  const transport: AccountAuthTransport = {
    register: async (input) => ({
      user: {
        id: 'coach-user',
        email: input.email,
        emailVerified: false,
        displayName: input.displayName,
      },
      verificationRequired: true,
    }),
    verifyEmail: async () => authenticated,
    login: async () => authenticated,
    exchangeOAuth: async () => authenticated,
    restore: async () => authenticated,
    logout: async () => undefined,
    forgotPassword: async () => undefined,
    resetPassword: async () => undefined,
  }
  return new AccountAuthController(transport, storage)
}
