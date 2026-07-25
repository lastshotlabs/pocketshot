export type PartyRole = 'host' | 'participant' | 'spectator' | 'emcee'

export interface PartyMember {
  id: string
  displayName: string
  role: PartyRole
  seat: number | null
  connected: boolean
}

export interface PartySessionSnapshot<Rules extends object> {
  hostId: string | null
  members: PartyMember[]
  rules: Rules
  stagedRules: Partial<Rules> | null
  paused: boolean
  rematchKey: string | null
  admissionPolicy?: 'open' | 'approval' | 'closed'
  admissionQueue?: PartyAdmissionRequest[]
  blockedMemberIds?: string[]
}

export interface PartyAdmissionRequest {
  id: string
  displayName: string
  role: Exclude<PartyRole, 'host'>
  requestedAt: number
  status: 'pending' | 'admitted' | 'denied'
}

export class PartySessionController<Rules extends object> {
  private members = new Map<string, PartyMember>()
  private admissions = new Map<string, PartyAdmissionRequest>()
  private blocked = new Set<string>()
  private state: Omit<PartySessionSnapshot<Rules>, 'members'>

  constructor(rules: Rules, snapshot?: PartySessionSnapshot<Rules>) {
    this.state = snapshot
      ? {
          hostId: snapshot.hostId,
          rules: structuredClone(snapshot.rules),
          stagedRules: snapshot.stagedRules ? structuredClone(snapshot.stagedRules) : null,
          paused: snapshot.paused,
          rematchKey: snapshot.rematchKey,
          admissionPolicy: snapshot.admissionPolicy ?? 'open',
          admissionQueue: [],
          blockedMemberIds: [],
        }
      : {
          hostId: null,
          rules: structuredClone(rules),
          stagedRules: null,
          paused: false,
          rematchKey: null,
          admissionPolicy: 'open',
          admissionQueue: [],
          blockedMemberIds: [],
        }
    for (const member of snapshot?.members ?? []) {
      this.members.set(member.id, structuredClone(member))
    }
    for (const request of snapshot?.admissionQueue ?? []) {
      this.admissions.set(request.id, structuredClone(request))
    }
    for (const id of snapshot?.blockedMemberIds ?? []) this.blocked.add(id)
  }

  get snapshot(): PartySessionSnapshot<Rules> {
    return {
      ...structuredClone(this.state),
      members: [...this.members.values()].map((member) => structuredClone(member)),
      admissionQueue: [...this.admissions.values()].map((request) => structuredClone(request)),
      blockedMemberIds: [...this.blocked],
    }
  }

  join(member: PartyMember): void {
    if (this.blocked.has(member.id)) throw new Error('Member is blocked')
    if (this.state.admissionPolicy === 'closed' && member.role !== 'host') {
      throw new Error('Party admission is closed')
    }
    if (
      this.state.admissionPolicy === 'approval' &&
      member.role !== 'host' &&
      this.admissions.get(member.id)?.status !== 'admitted'
    ) {
      throw new Error('Member has not been admitted')
    }
    if (!member.id || !member.displayName.trim()) throw new Error('Member identity is required')
    if (member.seat !== null && this.seatOwner(member.seat, member.id)) {
      throw new Error(`Seat ${member.seat} is already claimed`)
    }
    this.members.set(member.id, {
      ...structuredClone(member),
      displayName: member.displayName.trim(),
    })
    if (member.role === 'host') this.assignHost(member.id)
  }

  setAdmissionPolicy(
    actorId: string,
    policy: NonNullable<PartySessionSnapshot<Rules>['admissionPolicy']>,
  ): void {
    this.requireHost(actorId)
    this.state.admissionPolicy = policy
  }

  requestAdmission(request: Omit<PartyAdmissionRequest, 'status'>): 'admitted' | 'pending' {
    if (this.blocked.has(request.id)) throw new Error('Member is blocked')
    if (this.state.admissionPolicy === 'closed') throw new Error('Party admission is closed')
    const status = this.state.admissionPolicy === 'open' ? 'admitted' : 'pending'
    this.admissions.set(request.id, { ...structuredClone(request), status })
    return status
  }

  decideAdmission(actorId: string, memberId: string, admit: boolean): void {
    this.requireHost(actorId)
    const request = this.admissions.get(memberId)
    if (!request || request.status !== 'pending') throw new Error('No pending admission request')
    request.status = admit ? 'admitted' : 'denied'
  }

  leave(memberId: string): void {
    const member = this.requireMember(memberId)
    this.members.delete(memberId)
    if (member.id === this.state.hostId) {
      this.state.hostId = null
      if ([...this.members.values()].some((candidate) => candidate.connected)) this.recoverHost()
    }
  }

  block(actorId: string, memberId: string): void {
    this.requireHost(actorId)
    if (memberId === actorId) throw new Error('Host cannot block themself')
    this.blocked.add(memberId)
    this.admissions.delete(memberId)
    if (this.members.has(memberId)) this.members.delete(memberId)
  }

  unblock(actorId: string, memberId: string): void {
    this.requireHost(actorId)
    this.blocked.delete(memberId)
  }

  publicProjection(): {
    hostId: string | null
    members: Array<Pick<PartyMember, 'id' | 'displayName' | 'role' | 'seat' | 'connected'>>
    paused: boolean
  } {
    return {
      hostId: this.state.hostId,
      members: [...this.members.values()].map(({ id, displayName, role, seat, connected }) => ({
        id,
        displayName,
        role,
        seat,
        connected,
      })),
      paused: this.state.paused,
    }
  }

  claimSeat(memberId: string, seat: number): void {
    if (!Number.isInteger(seat) || seat < 0) throw new Error('Seat must be a non-negative integer')
    const member = this.requireMember(memberId)
    const owner = this.seatOwner(seat, memberId)
    if (owner) throw new Error(`Seat ${seat} is already claimed`)
    member.seat = seat
  }

  handoffSeat(fromId: string, toId: string): void {
    const from = this.requireMember(fromId)
    const to = this.requireMember(toId)
    if (from.seat === null) throw new Error('Source member has no seat')
    to.seat = from.seat
    from.seat = null
  }

  setConnected(memberId: string, connected: boolean): void {
    this.requireMember(memberId).connected = connected
  }

  recoverHost(preferredId?: string): string {
    const eligible = [...this.members.values()].filter(
      (member) => member.connected && member.role !== 'spectator',
    )
    const next =
      (preferredId ? eligible.find((member) => member.id === preferredId) : undefined) ??
      eligible.sort(
        (a, b) => (a.seat ?? Number.MAX_SAFE_INTEGER) - (b.seat ?? Number.MAX_SAFE_INTEGER),
      )[0]
    if (!next) throw new Error('No connected member can recover host control')
    this.assignHost(next.id)
    return next.id
  }

  pause(actorId: string): void {
    this.requireHost(actorId)
    this.state.paused = true
  }

  resume(actorId: string): void {
    this.requireHost(actorId)
    this.state.paused = false
  }

  stageRules(actorId: string, rules: Partial<Rules>): void {
    this.requireHost(actorId)
    this.state.stagedRules = { ...(this.state.stagedRules ?? {}), ...structuredClone(rules) }
  }

  applyStagedRules(): void {
    if (!this.state.stagedRules) return
    this.state.rules = { ...this.state.rules, ...this.state.stagedRules }
    this.state.stagedRules = null
  }

  startRematch(actorId: string, idempotencyKey: string): boolean {
    this.requireHost(actorId)
    if (!idempotencyKey) throw new Error('Rematch idempotency key is required')
    if (this.state.rematchKey === idempotencyKey) return false
    this.state.rematchKey = idempotencyKey
    this.applyStagedRules()
    this.state.paused = false
    return true
  }

  private assignHost(memberId: string): void {
    const member = this.requireMember(memberId)
    for (const candidate of this.members.values()) {
      if (candidate.role === 'host') candidate.role = 'participant'
    }
    member.role = 'host'
    this.state.hostId = memberId
  }

  private seatOwner(seat: number, exceptId: string): PartyMember | undefined {
    return [...this.members.values()].find(
      (member) => member.id !== exceptId && member.seat === seat,
    )
  }

  private requireMember(id: string): PartyMember {
    const member = this.members.get(id)
    if (!member) throw new Error(`Unknown member: ${id}`)
    return member
  }

  private requireHost(id: string): void {
    if (this.state.hostId !== id) throw new Error('Host authorization required')
  }
}

export interface TimedPhaseSnapshot {
  phase: string
  deadline: number | null
  pausedRemainingMs: number | null
  completed: boolean
}

export class TimedPhaseController {
  private state: TimedPhaseSnapshot

  constructor(
    phase: string,
    durationMs: number,
    private readonly now: () => number = Date.now,
    snapshot?: TimedPhaseSnapshot,
  ) {
    if (durationMs < 0) throw new Error('Duration cannot be negative')
    this.state = snapshot
      ? structuredClone(snapshot)
      : {
          phase,
          deadline: this.now() + durationMs,
          pausedRemainingMs: null,
          completed: durationMs === 0,
        }
  }

  get snapshot(): TimedPhaseSnapshot {
    this.reconcile()
    return structuredClone(this.state)
  }

  remainingMs(at = this.now()): number {
    if (this.state.completed) return 0
    if (this.state.pausedRemainingMs !== null) return this.state.pausedRemainingMs
    return Math.max(0, (this.state.deadline ?? at) - at)
  }

  isWarning(thresholdMs: number): boolean {
    return !this.state.completed && this.remainingMs() <= thresholdMs
  }

  pause(): void {
    if (this.state.completed || this.state.pausedRemainingMs !== null) return
    this.state.pausedRemainingMs = this.remainingMs()
    this.state.deadline = null
  }

  resume(): void {
    if (this.state.completed || this.state.pausedRemainingMs === null) return
    this.state.deadline = this.now() + this.state.pausedRemainingMs
    this.state.pausedRemainingMs = null
  }

  skip(): void {
    this.state.completed = true
    this.state.deadline = null
    this.state.pausedRemainingMs = null
  }

  reconcile(): boolean {
    if (
      !this.state.completed &&
      this.state.pausedRemainingMs === null &&
      this.remainingMs() === 0
    ) {
      this.skip()
      return true
    }
    return false
  }
}

export interface PrivateSubmission<Value> {
  actorId: string
  value: Value
  submittedAt: number
  editableUntil: number
  version: number
  idempotencyKey: string
  deliveryStatus?: 'pending' | 'accepted' | 'rejected'
  rejectionReason?: string
}

export class PrivateSubmissionController<Value> {
  private submissions = new Map<string, PrivateSubmission<Value>>()
  private processedKeys = new Set<string>()

  constructor(
    private readonly editWindowMs: number,
    private readonly now: () => number = Date.now,
    initial: PrivateSubmission<Value>[] = [],
  ) {
    for (const submission of initial) {
      this.submissions.set(submission.actorId, structuredClone(submission))
      this.processedKeys.add(submission.idempotencyKey)
    }
  }

  get snapshot(): PrivateSubmission<Value>[] {
    return [...this.submissions.values()].map((submission) => structuredClone(submission))
  }

  submit(actorId: string, value: Value, idempotencyKey: string): boolean {
    if (!actorId || !idempotencyKey) throw new Error('Actor and idempotency key are required')
    if (this.processedKeys.has(idempotencyKey)) return false
    const existing = this.submissions.get(actorId)
    if (existing && this.now() > existing.editableUntil) {
      throw new Error('Submission edit window has closed')
    }
    const submittedAt = this.now()
    this.submissions.set(actorId, {
      actorId,
      value: structuredClone(value),
      submittedAt,
      editableUntil: submittedAt + this.editWindowMs,
      version: (existing?.version ?? 0) + 1,
      idempotencyKey,
      deliveryStatus: 'pending',
    })
    this.processedKeys.add(idempotencyKey)
    return true
  }

  acknowledge(actorId: string, idempotencyKey: string): void {
    const submission = this.requireSubmission(actorId)
    if (submission.idempotencyKey !== idempotencyKey) return
    submission.deliveryStatus = 'accepted'
    delete submission.rejectionReason
  }

  reject(actorId: string, idempotencyKey: string, reason: string): void {
    if (!reason.trim()) throw new Error('Submission rejection reason is required')
    const submission = this.requireSubmission(actorId)
    if (submission.idempotencyKey !== idempotencyKey) return
    submission.deliveryStatus = 'rejected'
    submission.rejectionReason = reason.trim()
  }

  resend(actorId: string, idempotencyKey: string): boolean {
    const submission = this.requireSubmission(actorId)
    if (this.processedKeys.has(idempotencyKey)) return false
    if (submission.deliveryStatus !== 'rejected') {
      throw new Error('Only rejected submissions can be resent')
    }
    submission.idempotencyKey = idempotencyKey
    submission.deliveryStatus = 'pending'
    delete submission.rejectionReason
    this.processedKeys.add(idempotencyKey)
    return true
  }

  projection(
    viewerId: string,
    revealed: boolean,
  ): Array<{
    actorId: string
    submitted: true
    value?: Value
  }> {
    return [...this.submissions.values()].map((submission) => ({
      actorId: submission.actorId,
      submitted: true,
      ...(revealed || viewerId === submission.actorId
        ? { value: structuredClone(submission.value) }
        : {}),
    }))
  }

  private requireSubmission(actorId: string): PrivateSubmission<Value> {
    const submission = this.submissions.get(actorId)
    if (!submission) throw new Error(`No submission for actor: ${actorId}`)
    return submission
  }
}

export interface BallotSnapshot<Choice extends string> {
  eligible: string[]
  votes: Array<{ voterId: string; choices: Choice[] }>
  closed: boolean
  lastSequence?: number
  processedEventIds?: string[]
}

export class BallotController<Choice extends string> {
  private eligible: Set<string>
  private votes = new Map<string, Set<Choice>>()
  private closed = false
  private lastSequence = 0
  private processedEventIds = new Set<string>()

  constructor(eligible: string[], snapshot?: BallotSnapshot<Choice>) {
    this.eligible = new Set(snapshot?.eligible ?? eligible)
    this.closed = snapshot?.closed ?? false
    this.lastSequence = snapshot?.lastSequence ?? 0
    this.processedEventIds = new Set(snapshot?.processedEventIds ?? [])
    for (const vote of snapshot?.votes ?? []) this.votes.set(vote.voterId, new Set(vote.choices))
  }

  get snapshot(): BallotSnapshot<Choice> {
    return {
      eligible: [...this.eligible],
      votes: [...this.votes].map(([voterId, choices]) => ({ voterId, choices: [...choices] })),
      closed: this.closed,
      lastSequence: this.lastSequence,
      processedEventIds: [...this.processedEventIds],
    }
  }

  applyEvent(event: {
    id: string
    sequence: number
    voterId: string
    choice: Choice
    approved: boolean
  }): boolean {
    if (!event.id) throw new Error('Ballot event ID is required')
    if (this.processedEventIds.has(event.id) || event.sequence <= this.lastSequence) return false
    if (event.sequence !== this.lastSequence + 1) throw new Error('Ballot event sequence gap')
    this.set(event.voterId, event.choice, event.approved)
    this.processedEventIds.add(event.id)
    this.lastSequence = event.sequence
    return true
  }

  set(voterId: string, choice: Choice, approved: boolean): void {
    if (this.closed) throw new Error('Ballot is closed')
    if (!this.eligible.has(voterId)) throw new Error('Voter is not eligible')
    const choices = this.votes.get(voterId) ?? new Set<Choice>()
    if (approved) choices.add(choice)
    else choices.delete(choice)
    this.votes.set(voterId, choices)
  }

  totals(): Map<Choice, number> {
    const totals = new Map<Choice, number>()
    for (const choices of this.votes.values()) {
      for (const choice of choices) totals.set(choice, (totals.get(choice) ?? 0) + 1)
    }
    return totals
  }

  close(): Map<Choice, number> {
    this.closed = true
    return this.totals()
  }
}

export interface CorrectionSnapshot<State> {
  state: State
  armed: boolean
  proposal: State | null
  history: State[]
  version?: number
  actorId?: string | null
  audit?: CorrectionAuditEntry[]
}

export interface CorrectionAuditEntry {
  operation: 'arm' | 'propose' | 'cancel' | 'confirm' | 'undo'
  actorId: string
  version: number
  at: number
}

export class HostCorrectionController<State> {
  private state: CorrectionSnapshot<State>

  constructor(
    initial: State,
    snapshot?: CorrectionSnapshot<State>,
    private readonly now: () => number = Date.now,
  ) {
    this.state = snapshot
      ? {
          ...structuredClone(snapshot),
          version: snapshot.version ?? 0,
          actorId: snapshot.actorId ?? null,
          audit: structuredClone(snapshot.audit ?? []),
        }
      : {
          state: structuredClone(initial),
          armed: false,
          proposal: null,
          history: [],
          version: 0,
          actorId: null,
          audit: [],
        }
  }

  get snapshot(): CorrectionSnapshot<State> {
    return structuredClone(this.state)
  }

  arm(actorId = 'host'): void {
    if (!actorId) throw new Error('Correction actor is required')
    this.state.armed = true
    this.state.actorId = actorId
    this.record('arm')
  }

  propose(next: State, expectedVersion = this.state.version ?? 0): void {
    if (!this.state.armed) throw new Error('Correction must be armed')
    if (expectedVersion !== this.state.version) throw new Error('Correction version conflict')
    this.state.proposal = structuredClone(next)
    this.record('propose')
  }

  cancel(): void {
    if (this.state.armed) this.record('cancel')
    this.state.armed = false
    this.state.proposal = null
    this.state.actorId = null
  }

  confirm(expectedVersion = this.state.version ?? 0): number {
    if (!this.state.armed || this.state.proposal === null) {
      throw new Error('No armed correction proposal')
    }
    if (expectedVersion !== this.state.version) throw new Error('Correction version conflict')
    this.state.history.push(structuredClone(this.state.state))
    this.state.state = structuredClone(this.state.proposal)
    this.state.version = (this.state.version ?? 0) + 1
    this.record('confirm')
    this.state.armed = false
    this.state.proposal = null
    this.state.actorId = null
    return this.state.version
  }

  undo(actorId = 'host'): boolean {
    const previous = this.state.history.pop()
    if (previous === undefined) return false
    this.state.state = previous
    this.state.actorId = actorId
    this.state.version = (this.state.version ?? 0) + 1
    this.record('undo')
    this.state.actorId = null
    return true
  }

  private record(operation: CorrectionAuditEntry['operation']): void {
    ;(this.state.audit ??= []).push({
      operation,
      actorId: this.state.actorId ?? 'host',
      version: this.state.version ?? 0,
      at: this.now(),
    })
  }
}

export interface SharedDeviceSnapshot {
  activeSeat: number | null
  curtainVisible: boolean
  armed: boolean
  inFlightKey: string | null
  wakeLock: boolean
}

export class SharedDeviceController {
  private state: SharedDeviceSnapshot

  constructor(snapshot?: SharedDeviceSnapshot) {
    this.state =
      snapshot ??
      ({
        activeSeat: null,
        curtainVisible: false,
        armed: false,
        inFlightKey: null,
        wakeLock: false,
      } satisfies SharedDeviceSnapshot)
  }

  get snapshot(): SharedDeviceSnapshot {
    return structuredClone(this.state)
  }

  begin(seat: number): void {
    this.state.activeSeat = seat
    this.state.curtainVisible = true
    this.state.armed = false
    this.state.wakeLock = true
  }

  arm(seat: number): void {
    if (this.state.activeSeat !== seat) throw new Error('Only the active seat can dismiss handoff')
    this.state.curtainVisible = false
    this.state.armed = true
  }

  lockCommand(key: string): boolean {
    if (!this.state.armed) throw new Error('Active seat is not armed')
    if (this.state.inFlightKey === key) return false
    if (this.state.inFlightKey !== null) throw new Error('Another command is in flight')
    this.state.inFlightKey = key
    return true
  }

  settleCommand(key: string): void {
    if (this.state.inFlightKey !== key) throw new Error('Command key does not match in-flight work')
    this.state.inFlightKey = null
  }

  end(): void {
    this.state = {
      activeSeat: null,
      curtainVisible: false,
      armed: false,
      inFlightKey: null,
      wakeLock: false,
    }
  }
}

export interface CueRequest {
  roomId: string
  eventId: string
  actorId: string
  recipientId: string
  at: number
}

export class PersonalCuePolicy {
  private mutedRooms = new Set<string>()
  private seen = new Map<string, number>()

  constructor(
    private readonly duplicateWindowMs = 5_000,
    private quietHours: { startHour: number; endHour: number } | null = null,
  ) {}

  setRoomMuted(roomId: string, muted: boolean): void {
    if (muted) this.mutedRooms.add(roomId)
    else this.mutedRooms.delete(roomId)
  }

  setQuietHours(value: { startHour: number; endHour: number } | null): void {
    this.quietHours = value
  }

  shouldDeliver(request: CueRequest, lifecycle: 'active' | 'background' | 'suspended'): boolean {
    if (request.actorId !== request.recipientId || this.mutedRooms.has(request.roomId)) return false
    if (lifecycle === 'suspended') return false
    const hour = new Date(request.at).getHours()
    if (this.inQuietHours(hour)) return false
    const key = `${request.roomId}:${request.eventId}:${request.recipientId}`
    const last = this.seen.get(key)
    if (last !== undefined && request.at - last < this.duplicateWindowMs) return false
    this.seen.set(key, request.at)
    return true
  }

  private inQuietHours(hour: number): boolean {
    if (!this.quietHours) return false
    const { startHour, endHour } = this.quietHours
    return startHour <= endHour
      ? hour >= startHour && hour < endHour
      : hour >= startHour || hour < endHour
  }
}

export interface PartyActivityEvent {
  id: string
  sequence: number
  kind: string
  actorId?: string
  text: string
  createdAt: number
  reactions: Record<string, string[]>
}

export interface PartyActivitySnapshot {
  events: PartyActivityEvent[]
  lastSequence: number
}

export class PartyActivityController {
  private events = new Map<string, PartyActivityEvent>()
  private lastSequence = 0

  constructor(
    snapshot?: PartyActivitySnapshot,
    private readonly maximumEvents = 100,
  ) {
    if (!Number.isInteger(maximumEvents) || maximumEvents < 1) {
      throw new Error('Activity capacity must be a positive integer')
    }
    this.lastSequence = snapshot?.lastSequence ?? 0
    for (const event of snapshot?.events ?? []) this.events.set(event.id, structuredClone(event))
  }

  get snapshot(): PartyActivitySnapshot {
    return {
      events: [...this.events.values()]
        .sort((left, right) => left.sequence - right.sequence)
        .map((event) => structuredClone(event)),
      lastSequence: this.lastSequence,
    }
  }

  append(event: Omit<PartyActivityEvent, 'reactions'>): boolean {
    if (this.events.has(event.id) || event.sequence <= this.lastSequence) return false
    if (event.sequence !== this.lastSequence + 1) throw new Error('Activity event sequence gap')
    this.events.set(event.id, { ...structuredClone(event), reactions: {} })
    this.lastSequence = event.sequence
    this.trim()
    return true
  }

  react(eventId: string, actorId: string, emoji: string, active: boolean): void {
    const event = this.events.get(eventId)
    if (!event) throw new Error(`Unknown activity event: ${eventId}`)
    if (!actorId || !emoji.trim()) throw new Error('Reaction actor and emoji are required')
    const actors = new Set(event.reactions[emoji] ?? [])
    if (active) actors.add(actorId)
    else actors.delete(actorId)
    if (actors.size) event.reactions[emoji] = [...actors].sort()
    else delete event.reactions[emoji]
  }

  publicProjection(limit = 20): PartyActivityEvent[] {
    if (!Number.isInteger(limit) || limit < 0) throw new Error('Activity limit cannot be negative')
    return this.snapshot.events.slice(-limit)
  }

  private trim(): void {
    const overflow = this.snapshot.events.length - this.maximumEvents
    if (overflow <= 0) return
    for (const event of this.snapshot.events.slice(0, overflow)) this.events.delete(event.id)
  }
}

export type GameDashboardStatus = 'lobby' | 'active' | 'paused' | 'complete' | 'cancelled' | 'left'

export interface GameDashboardRecord {
  id: string
  product: string
  title: string
  status: GameDashboardStatus
  joinCode?: string
  updatedAt: number
  resumable: boolean
  rematchOf?: string
}

export interface GameDashboardSnapshot {
  records: GameDashboardRecord[]
  stale: boolean
  refreshedAt: number | null
}

export class GameDashboardController {
  private records = new Map<string, GameDashboardRecord>()
  private stale = false
  private refreshedAt: number | null = null

  constructor(
    snapshot?: GameDashboardSnapshot,
    private readonly now: () => number = Date.now,
  ) {
    this.stale = snapshot?.stale ?? false
    this.refreshedAt = snapshot?.refreshedAt ?? null
    for (const record of snapshot?.records ?? []) {
      this.records.set(record.id, structuredClone(record))
    }
  }

  get snapshot(): GameDashboardSnapshot {
    return {
      records: [...this.records.values()]
        .sort(
          (left, right) =>
            Number(isActive(right.status)) - Number(isActive(left.status)) ||
            right.updatedAt - left.updatedAt ||
            left.id.localeCompare(right.id),
        )
        .map((record) => structuredClone(record)),
      stale: this.stale,
      refreshedAt: this.refreshedAt,
    }
  }

  upsert(record: Omit<GameDashboardRecord, 'updatedAt'> & { updatedAt?: number }): void {
    const existing = this.records.get(record.id)
    const updatedAt = record.updatedAt ?? this.now()
    if (existing && existing.updatedAt > updatedAt) return
    this.records.set(record.id, { ...structuredClone(record), updatedAt })
  }

  setStatus(id: string, status: GameDashboardStatus): void {
    const record = this.require(id)
    record.status = status
    record.resumable = isActive(status)
    record.updatedAt = this.now()
  }

  leave(id: string): void {
    this.setStatus(id, 'left')
  }

  recover(id: string): GameDashboardRecord {
    const record = this.require(id)
    if (!record.resumable || !isActive(record.status)) {
      throw new Error('Game is not resumable')
    }
    return structuredClone(record)
  }

  createRematch(sourceId: string, id: string): GameDashboardRecord {
    if (this.records.has(id)) return structuredClone(this.records.get(id)!)
    const source = this.require(sourceId)
    const rematch: GameDashboardRecord = {
      ...structuredClone(source),
      id,
      status: 'lobby',
      resumable: true,
      rematchOf: sourceId,
      updatedAt: this.now(),
    }
    this.records.set(id, rematch)
    return structuredClone(rematch)
  }

  markStale(): void {
    this.stale = true
  }

  refresh(records: GameDashboardRecord[]): void {
    for (const record of records) this.upsert(record)
    this.stale = false
    this.refreshedAt = this.now()
  }

  page(
    options: {
      scope?: 'active' | 'history' | 'all'
      offset?: number
      limit?: number
    } = {},
  ): { items: GameDashboardRecord[]; nextOffset: number | null } {
    const scope = options.scope ?? 'all'
    const records = this.snapshot.records.filter((record) =>
      scope === 'all'
        ? true
        : scope === 'active'
          ? isActive(record.status)
          : !isActive(record.status),
    )
    const offset = Math.max(0, options.offset ?? 0)
    const limit = Math.max(1, options.limit ?? 20)
    const items = records.slice(offset, offset + limit)
    return {
      items,
      nextOffset: offset + items.length < records.length ? offset + items.length : null,
    }
  }

  private require(id: string): GameDashboardRecord {
    const record = this.records.get(id)
    if (!record) throw new Error(`Unknown game: ${id}`)
    return record
  }
}

function isActive(status: GameDashboardStatus): boolean {
  return status === 'lobby' || status === 'active' || status === 'paused'
}

export type ContentStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'archived'

export interface ContentCollection<Item> {
  id: string
  ownerId: string
  title: string
  description: string
  status: ContentStatus
  revision: number
  items: Item[]
  updatedAt: number
  publishedAt: number | null
}

export interface ContentPage<Item> {
  items: ContentCollection<Item>[]
  nextCursor: string | null
}

export interface ContentProposal<Item> {
  id: string
  collectionId: string
  items: Item[]
  rationale: string
  status: 'pending' | 'accepted' | 'rejected'
}

export class ContentLibraryController<Item> {
  private collections = new Map<string, ContentCollection<Item>>()
  private proposals = new Map<string, ContentProposal<Item>>()

  constructor(
    private readonly validateItem: (item: Item) => string[],
    private readonly identity: (item: Item) => string,
    private readonly now: () => number = Date.now,
  ) {}

  get snapshot(): ContentCollection<Item>[] {
    return [...this.collections.values()].map((collection) => structuredClone(collection))
  }

  create(id: string, ownerId: string, title: string, description = ''): void {
    if (!id || !ownerId || !title.trim())
      throw new Error('Collection identity and title are required')
    if (this.collections.has(id)) throw new Error(`Collection already exists: ${id}`)
    this.collections.set(id, {
      id,
      ownerId,
      title: title.trim(),
      description: description.trim(),
      status: 'draft',
      revision: 1,
      items: [],
      updatedAt: this.now(),
      publishedAt: null,
    })
  }

  browse(
    options: {
      viewerId?: string
      scope?: 'all' | 'mine'
      query?: string
      sort?: 'updated' | 'title'
      cursor?: string
      limit?: number
    } = {},
  ): ContentPage<Item> {
    const query = options.query?.trim().toLocaleLowerCase() ?? ''
    const offset = decodeCursor(options.cursor)
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100))
    const visible = this.snapshot
      .filter((collection) =>
        options.scope === 'mine' ? collection.ownerId === options.viewerId : true,
      )
      .filter(
        (collection) =>
          !query ||
          collection.title.toLocaleLowerCase().includes(query) ||
          collection.description.toLocaleLowerCase().includes(query) ||
          collection.items.some((item) => JSON.stringify(item).toLocaleLowerCase().includes(query)),
      )
      .sort((a, b) =>
        options.sort === 'title'
          ? a.title.localeCompare(b.title)
          : b.updatedAt - a.updatedAt || a.id.localeCompare(b.id),
      )
    const items = visible.slice(offset, offset + limit)
    const nextOffset = offset + items.length
    return { items, nextCursor: nextOffset < visible.length ? encodeCursor(nextOffset) : null }
  }

  updateMetadata(
    id: string,
    actorId: string,
    revision: number,
    patch: { title?: string; description?: string },
  ): number {
    const collection = this.requireEditable(id, actorId, revision)
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new Error('Collection title is required')
      collection.title = patch.title.trim()
    }
    if (patch.description !== undefined) collection.description = patch.description.trim()
    return this.touch(collection)
  }

  replaceItems(id: string, actorId: string, revision: number, items: Item[]): number {
    const collection = this.requireEditable(id, actorId, revision)
    this.validateItems(items)
    collection.items = deduplicate(items, this.identity)
    return this.touch(collection)
  }

  appendItems(id: string, actorId: string, revision: number, items: Item[]): number {
    const collection = this.requireEditable(id, actorId, revision)
    this.validateItems(items)
    collection.items = deduplicate([...collection.items, ...items], this.identity)
    return this.touch(collection)
  }

  duplicate(sourceId: string, targetId: string, ownerId: string, title?: string): void {
    const source = this.require(sourceId)
    this.create(targetId, ownerId, title ?? `${source.title} copy`, source.description)
    const target = this.require(targetId)
    target.items = structuredClone(source.items)
  }

  health(id: string): { itemCount: number; errors: string[]; publishable: boolean } {
    const collection = this.require(id)
    const errors = collection.items.flatMap((item, index) =>
      this.validateItem(item).map((error) => `Item ${index + 1}: ${error}`),
    )
    const identities = collection.items.map(this.identity)
    if (new Set(identities).size !== identities.length)
      errors.push('Duplicate items are not allowed')
    if (collection.items.length === 0) errors.push('At least one item is required')
    return { itemCount: collection.items.length, errors, publishable: errors.length === 0 }
  }

  submit(id: string, actorId: string): void {
    const collection = this.requireOwner(id, actorId)
    if (collection.status !== 'draft') throw new Error('Only drafts can be submitted')
    if (!this.health(id).publishable) throw new Error('Collection health checks must pass')
    collection.status = 'submitted'
    this.touch(collection)
  }

  approve(id: string): void {
    const collection = this.require(id)
    if (collection.status !== 'submitted')
      throw new Error('Only submitted collections can be approved')
    collection.status = 'approved'
    this.touch(collection)
  }

  publish(id: string): void {
    const collection = this.require(id)
    if (collection.status !== 'approved')
      throw new Error('Only approved collections can be published')
    collection.status = 'published'
    collection.publishedAt = this.now()
    this.touch(collection)
  }

  unpublish(id: string): void {
    const collection = this.require(id)
    if (collection.status !== 'published') throw new Error('Collection is not published')
    collection.status = 'approved'
    collection.publishedAt = null
    this.touch(collection)
  }

  archive(id: string, actorId: string): void {
    const collection = this.requireOwner(id, actorId)
    collection.status = 'archived'
    this.touch(collection)
  }

  addProposal(proposal: Omit<ContentProposal<Item>, 'status'>): void {
    if (this.proposals.has(proposal.id)) return
    this.validateItems(proposal.items)
    this.requireOwner(proposal.collectionId, this.require(proposal.collectionId).ownerId)
    this.proposals.set(proposal.id, { ...structuredClone(proposal), status: 'pending' })
  }

  reviewProposal(id: string, actorId: string, accept: boolean): void {
    const proposal = this.proposals.get(id)
    if (!proposal) throw new Error(`Unknown proposal: ${id}`)
    const collection = this.requireOwner(proposal.collectionId, actorId)
    if (proposal.status !== 'pending') throw new Error('Proposal has already been reviewed')
    proposal.status = accept ? 'accepted' : 'rejected'
    if (accept) {
      collection.items = deduplicate([...collection.items, ...proposal.items], this.identity)
      this.touch(collection)
    }
  }

  proposalSnapshot(): ContentProposal<Item>[] {
    return [...this.proposals.values()].map((proposal) => structuredClone(proposal))
  }

  private validateItems(items: Item[]): void {
    const errors = items.flatMap(this.validateItem)
    if (errors.length) throw new Error(`Invalid content: ${errors.join('; ')}`)
  }

  private touch(collection: ContentCollection<Item>): number {
    collection.revision += 1
    collection.updatedAt = this.now()
    return collection.revision
  }

  private require(id: string): ContentCollection<Item> {
    const collection = this.collections.get(id)
    if (!collection) throw new Error(`Unknown collection: ${id}`)
    return collection
  }

  private requireOwner(id: string, actorId: string): ContentCollection<Item> {
    const collection = this.require(id)
    if (collection.ownerId !== actorId) throw new Error('Collection owner authorization required')
    return collection
  }

  private requireEditable(id: string, actorId: string, revision: number): ContentCollection<Item> {
    const collection = this.requireOwner(id, actorId)
    if (collection.status !== 'draft') throw new Error('Only draft collections can be edited')
    if (collection.revision !== revision) {
      throw new Error(`Revision conflict: expected ${collection.revision}, received ${revision}`)
    }
    return collection
  }
}

function deduplicate<Item>(items: Item[], identity: (item: Item) => string): Item[] {
  const found = new Map<string, Item>()
  for (const item of items) {
    const key = identity(item).trim().toLocaleLowerCase()
    if (!found.has(key)) found.set(key, structuredClone(item))
  }
  return [...found.values()]
}

function encodeCursor(offset: number): string {
  return `offset:${offset}`
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0
  const match = /^offset:(\d+)$/.exec(cursor)
  if (!match) throw new Error('Invalid content cursor')
  return Number(match[1])
}
