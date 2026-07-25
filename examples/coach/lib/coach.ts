import { type AiConversation, type AiMemoryFact } from '@lastshotlabs/pocketshot/ai'
import {
  AccountAuthController,
  type AccountAuthTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'
import { type MediaCaptureAdapter } from '@lastshotlabs/pocketshot/media'
import {
  EntitlementController,
  GoalController,
  MetricLogController,
  WorkoutController,
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
  memory: AiMemoryFact[]
  exportStatus: 'idle' | 'requested' | 'ready'
  error: string | null
  goalProgress: number
  chartPoints: number[]
  workoutStatus: 'idle' | 'active' | 'complete'
  proAccess: boolean
  accountStatus: 'anonymous' | 'verification-required' | 'authenticated' | 'error'
  accountEmail: string | null
}

export class CoachDemoController {
  private stateValue: CoachState = {
    ready: false,
    conversation: null,
    logs: [],
    mediaStatus: null,
    memory: [],
    exportStatus: 'idle',
    error: null,
    goalProgress: 0,
    chartPoints: [],
    workoutStatus: 'idle',
    proAccess: false,
    accountStatus: 'anonymous',
    accountEmail: null,
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
  readonly workouts = new WorkoutController()
  readonly billing = new EntitlementController({
    purchase: async (productId) => ({
      productId,
      state: 'active',
      expiresAt: '2026-08-25',
    }),
    restore: async () => [{ productId: 'coach-pro', state: 'grace', expiresAt: '2026-07-28' }],
    refresh: async () => [],
  })
  readonly account = createDemoAccount()
  constructor(capture: MediaCaptureAdapter = defaultCoachCapture()) {
    this.media = createCoachMedia(capture)
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
    this.emit()
  }

  async remember(content: string): Promise<void> {
    await this.memory.create({ content, trusted: true, source: 'user' })
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

  startWorkout(): void {
    this.workouts.saveProgram({
      id: 'starter',
      name: 'Starter strength',
      exercises: [{ id: 'squat', name: 'Squat', targetSets: 3, targetReps: 5 }],
    })
    this.workouts.start('workout-1', 'starter', '2026-07-25T12:00:00.000Z')
    this.stateValue.workoutStatus = 'active'
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
    this.emit()
  }

  completeWorkout(): void {
    this.workouts.complete('2026-07-25T12:30:00.000Z')
    this.stateValue.workoutStatus = 'complete'
    this.emit()
  }

  async purchasePro(): Promise<void> {
    await this.billing.purchase('coach-pro')
    this.stateValue.proAccess = this.billing.canAccess('coach-pro')
    this.emit()
  }

  async restorePro(): Promise<void> {
    await this.billing.restore()
    this.stateValue.proAccess = this.billing.canAccess('coach-pro')
    this.emit()
  }

  requestExport(): void {
    this.stateValue.exportStatus = 'requested'
    this.emit()
    void Promise.resolve().then(() => {
      this.stateValue.exportStatus = 'ready'
      this.emit()
    })
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
