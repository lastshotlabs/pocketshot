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
}

export class PartySessionController<Rules extends object> {
  private members = new Map<string, PartyMember>()
  private state: Omit<PartySessionSnapshot<Rules>, 'members'>

  constructor(rules: Rules, snapshot?: PartySessionSnapshot<Rules>) {
    this.state = snapshot
      ? {
          hostId: snapshot.hostId,
          rules: structuredClone(snapshot.rules),
          stagedRules: snapshot.stagedRules ? structuredClone(snapshot.stagedRules) : null,
          paused: snapshot.paused,
          rematchKey: snapshot.rematchKey,
        }
      : {
          hostId: null,
          rules: structuredClone(rules),
          stagedRules: null,
          paused: false,
          rematchKey: null,
        }
    for (const member of snapshot?.members ?? []) {
      this.members.set(member.id, structuredClone(member))
    }
  }

  get snapshot(): PartySessionSnapshot<Rules> {
    return {
      ...structuredClone(this.state),
      members: [...this.members.values()].map((member) => structuredClone(member)),
    }
  }

  join(member: PartyMember): void {
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
    })
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
}

export interface BallotSnapshot<Choice extends string> {
  eligible: string[]
  votes: Array<{ voterId: string; choices: Choice[] }>
  closed: boolean
}

export class BallotController<Choice extends string> {
  private eligible: Set<string>
  private votes = new Map<string, Set<Choice>>()
  private closed = false

  constructor(eligible: string[], snapshot?: BallotSnapshot<Choice>) {
    this.eligible = new Set(snapshot?.eligible ?? eligible)
    this.closed = snapshot?.closed ?? false
    for (const vote of snapshot?.votes ?? []) this.votes.set(vote.voterId, new Set(vote.choices))
  }

  get snapshot(): BallotSnapshot<Choice> {
    return {
      eligible: [...this.eligible],
      votes: [...this.votes].map(([voterId, choices]) => ({ voterId, choices: [...choices] })),
      closed: this.closed,
    }
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
}

export class HostCorrectionController<State> {
  private state: CorrectionSnapshot<State>

  constructor(initial: State, snapshot?: CorrectionSnapshot<State>) {
    this.state = snapshot
      ? structuredClone(snapshot)
      : { state: structuredClone(initial), armed: false, proposal: null, history: [] }
  }

  get snapshot(): CorrectionSnapshot<State> {
    return structuredClone(this.state)
  }

  arm(): void {
    this.state.armed = true
  }

  propose(next: State): void {
    if (!this.state.armed) throw new Error('Correction must be armed')
    this.state.proposal = structuredClone(next)
  }

  cancel(): void {
    this.state.armed = false
    this.state.proposal = null
  }

  confirm(): void {
    if (!this.state.armed || this.state.proposal === null) {
      throw new Error('No armed correction proposal')
    }
    this.state.history.push(structuredClone(this.state.state))
    this.state.state = structuredClone(this.state.proposal)
    this.cancel()
  }

  undo(): boolean {
    const previous = this.state.history.pop()
    if (previous === undefined) return false
    this.state.state = previous
    return true
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
