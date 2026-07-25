import {
  BallotController,
  ContentLibraryController,
  GameDashboardController,
  HostCorrectionController,
  PartyActivityController,
  PartySessionController,
  PrivateSubmissionController,
  TimedPhaseController,
  type BallotSnapshot,
  type CorrectionSnapshot,
  type PartyActivitySnapshot,
  type PartySessionSnapshot,
  type PrivateSubmission,
  type TimedPhaseSnapshot,
  type GameDashboardSnapshot,
} from '@lastshotlabs/pocketshot/party-session'
import {
  AccountAuthController,
  PasskeyLifecycleController,
  type AccountAuthTransport,
  type PasskeyTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'

export type BlankSlatePhase =
  | 'entry'
  | 'lobby'
  | 'write'
  | 'reveal'
  | 'vote'
  | 'summary'
  | 'sudden-death'
  | 'results'

export interface SlatePlayer {
  id: string
  name: string
  score: number
}

export interface SlateGroup {
  id: string
  answer: string
  playerIds: string[]
}

export interface BlankSlateState {
  phase: BlankSlatePhase
  prompt: string
  players: SlatePlayer[]
  submittedIds: string[]
  submissionStates: Record<string, { status: 'pending' | 'accepted' | 'rejected'; reason?: string }>
  groups: SlateGroup[]
  round: number
  targetScore: number
  winMode: 'target-score' | 'fixed-rounds'
  fixedRounds: number
  paused: boolean
  winnerIds: string[]
  notice: string | null
  ended: boolean
  endConfirmationPending: boolean
  blockedPlayerIds: string[]
  identityStatus: 'guest' | 'account' | 'passkey'
  identityEmail: string | null
  passkeyCount: number
}

type BlankSlateRules = {
  targetScore: number
  writeMs: number
  winMode: 'target-score' | 'fixed-rounds'
  fixedRounds: number
}

export interface BlankSlateSnapshot {
  state: BlankSlateState
  session: PartySessionSnapshot<BlankSlateRules>
  submissions: PrivateSubmission<string>[]
  corrections: CorrectionSnapshot<SlateGroup[]>
  ballot: BallotSnapshot<string> | null
  timer: TimedPhaseSnapshot
  dashboard: GameDashboardSnapshot
  activity?: PartyActivitySnapshot
  currentGameId: string
}

export class BlankSlateController {
  private value: BlankSlateState
  private readonly session: PartySessionController<BlankSlateRules>
  private submissions: PrivateSubmissionController<string>
  private corrections: HostCorrectionController<SlateGroup[]>
  private ballot: BallotController<string> | null
  private timer: TimedPhaseController
  private currentGameId: string
  private readonly activity: PartyActivityController
  private readonly initialState: BlankSlateState = {
    phase: 'entry',
    prompt: 'Birthday ___',
    players: [
      { id: 'p1', name: 'Alex', score: 0 },
      { id: 'p2', name: 'Sam', score: 0 },
      { id: 'p3', name: 'Jo', score: 0 },
    ],
    submittedIds: [],
    submissionStates: {},
    groups: [],
    round: 0,
    targetScore: 12,
    winMode: 'target-score',
    fixedRounds: 5,
    paused: false,
    winnerIds: [],
    notice: null,
    ended: false,
    endConfirmationPending: false,
    blockedPlayerIds: [],
    identityStatus: 'guest',
    identityEmail: null,
    passkeyCount: 0,
  }
  private readonly listeners = new Set<(state: BlankSlateState) => void>()
  readonly prompts = new ContentLibraryController<{ cue: string }>(validateCue, (item) => item.cue)
  readonly games: GameDashboardController
  readonly account = createBlankSlateAccount()
  readonly passkeys = createBlankSlatePasskeys()

  constructor(snapshot?: BlankSlateSnapshot) {
    this.value = structuredClone(snapshot?.state ?? this.initialState)
    this.session = new PartySessionController(
      { targetScore: 12, writeMs: 30_000, winMode: 'target-score', fixedRounds: 5 },
      snapshot?.session,
    )
    this.submissions = new PrivateSubmissionController(5_000, Date.now, snapshot?.submissions)
    this.corrections = new HostCorrectionController([], snapshot?.corrections)
    this.ballot = snapshot?.ballot
      ? new BallotController(snapshot.ballot.eligible, snapshot.ballot)
      : null
    this.timer = new TimedPhaseController(
      snapshot?.timer.phase ?? 'idle',
      0,
      Date.now,
      snapshot?.timer,
    )
    this.currentGameId = snapshot?.currentGameId ?? 'blankslate-game-1'
    this.games = new GameDashboardController(snapshot?.dashboard)
    this.activity = new PartyActivityController(snapshot?.activity)
    if (!snapshot) {
      this.value.players.forEach((player, seat) =>
        this.session.join({
          id: player.id,
          displayName: player.name,
          role: seat === 0 ? 'host' : 'participant',
          seat,
          connected: true,
        }),
      )
      this.games.upsert({
        id: this.currentGameId,
        product: 'blankslate',
        title: 'Blank Slate match',
        status: 'lobby',
        joinCode: 'SLATE-42',
        resumable: true,
      })
    }
    this.prompts.create('starter', 'p1', 'Starter prompts')
    this.prompts.appendItems('starter', 'p1', 1, [
      { cue: 'Birthday ___' },
      { cue: '___ room' },
      { cue: 'Super ___ hero' },
    ])
  }

  get state(): BlankSlateState {
    return structuredClone(this.value)
  }

  exportSnapshot(): BlankSlateSnapshot {
    return {
      state: this.state,
      session: this.session.snapshot,
      submissions: this.submissions.snapshot,
      corrections: this.corrections.snapshot,
      ballot: this.ballot?.snapshot ?? null,
      timer: this.timer.snapshot,
      dashboard: this.games.snapshot,
      currentGameId: this.currentGameId,
      activity: this.activity.snapshot,
    }
  }

  subscribe(listener: (state: BlankSlateState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  enter(): void {
    this.value.phase = 'lobby'
    this.games.setStatus(this.currentGameId, 'lobby')
    this.emit()
  }

  async signInOAuth(provider: 'apple' | 'google'): Promise<void> {
    await this.account.completeOAuth(
      provider,
      'demo-code',
      `pocketshot-blankslate://oauth/${provider}`,
    )
    this.value.identityStatus = 'account'
    this.value.identityEmail = this.account.snapshot.user?.email ?? null
    this.enter()
  }

  async registerPasskey(platform: 'ios' | 'android'): Promise<void> {
    await this.passkeys.register('Blank Slate phone', platform)
    this.value.passkeyCount = this.passkeys.snapshot.credentials.length
    this.emit()
  }

  async signInPasskey(): Promise<void> {
    await this.passkeys.login()
    this.value.identityStatus = 'passkey'
    this.value.identityEmail = this.passkeys.snapshot.user?.email ?? null
    this.value.passkeyCount = this.passkeys.snapshot.credentials.length
    this.enter()
  }

  async removePasskey(): Promise<void> {
    const credential = this.passkeys.snapshot.credentials[0]
    if (!credential) return
    await this.passkeys.remove(credential.credentialId)
    this.value.passkeyCount = this.passkeys.snapshot.credentials.length
    this.emit()
  }

  join(code: string): boolean {
    if (code.trim().toLocaleUpperCase() !== 'SLATE-42') {
      this.value.notice = 'That Blank Slate invite is invalid or expired'
      this.emit()
      return false
    }
    this.enter()
    return true
  }

  startRound(): void {
    this.session.applyStagedRules()
    const rules = this.session.snapshot.rules
    this.value.targetScore = rules.targetScore
    this.value.winMode = rules.winMode
    this.value.fixedRounds = rules.fixedRounds
    this.value.round += 1
    this.games.setStatus(this.currentGameId, 'active')
    this.value.phase = 'write'
    this.value.submittedIds = []
    this.value.submissionStates = {}
    this.value.groups = []
    this.submissions = new PrivateSubmissionController<string>(5_000)
    this.corrections = new HostCorrectionController<SlateGroup[]>([])
    this.timer = new TimedPhaseController('write', 30_000)
    this.appendActivity('round-start', `Round ${this.value.round} started`)
    this.emit()
  }

  submit(playerId: string, answer: string, key: string): boolean {
    const normalized = answer.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
    if (!normalized) {
      this.value.notice = 'Write a word before locking in'
      this.emit()
      return false
    }
    const accepted = this.submissions.submit(playerId, normalized, key)
    if (accepted && !this.value.submittedIds.includes(playerId))
      this.value.submittedIds.push(playerId)
    if (accepted) this.value.submissionStates[playerId] = { status: 'pending' }
    this.emit()
    return accepted
  }

  acknowledgeSubmission(playerId: string, key: string): void {
    this.submissions.acknowledge(playerId, key)
    const submission = this.submissions.snapshot.find((candidate) => candidate.actorId === playerId)
    if (submission?.deliveryStatus === 'accepted') {
      this.value.submissionStates[playerId] = { status: 'accepted' }
      this.emit()
    }
  }

  rejectSubmission(playerId: string, key: string, reason: string): void {
    this.submissions.reject(playerId, key, reason)
    const submission = this.submissions.snapshot.find((candidate) => candidate.actorId === playerId)
    if (submission?.deliveryStatus === 'rejected') {
      this.value.submissionStates[playerId] = {
        status: 'rejected',
        reason: submission.rejectionReason,
      }
      this.value.notice = `${this.player(playerId).name}'s slate needs to be resent`
      this.emit()
    }
  }

  resendSubmission(playerId: string, key: string): boolean {
    const accepted = this.submissions.resend(playerId, key)
    if (accepted) {
      this.value.submissionStates[playerId] = { status: 'pending' }
      this.value.notice = null
      this.emit()
    }
    return accepted
  }

  privateProjection(viewerId: string) {
    return this.submissions.projection(viewerId, false)
  }

  tvProjection() {
    return {
      phase: this.value.phase,
      prompt: this.value.prompt,
      submittedIds: [...this.value.submittedIds],
      submittedCount: this.value.submittedIds.length,
      ...(this.value.phase === 'reveal' ||
      this.value.phase === 'summary' ||
      this.value.phase === 'results'
        ? { groups: structuredClone(this.value.groups) }
        : {}),
    }
  }

  reveal(): void {
    if (this.value.submittedIds.length !== this.value.players.length) {
      this.value.notice = 'Waiting for every slate'
      this.emit()
      return
    }
    const revealed = this.submissions.projection('host', true)
    const byAnswer = new Map<string, string[]>()
    for (const slate of revealed) {
      const answer = slate.value ?? ''
      byAnswer.set(answer, [...(byAnswer.get(answer) ?? []), slate.actorId])
    }
    this.value.groups = [...byAnswer].map(([answer, playerIds], index) => ({
      id: `group-${index + 1}`,
      answer,
      playerIds,
    }))
    this.corrections = new HostCorrectionController(this.value.groups)
    this.value.phase = 'reveal'
    this.value.notice = null
    this.appendActivity('reveal', `${this.value.groups.length} slate groups revealed`)
    this.emit()
  }

  merge(groupIds: string[]): void {
    const selected = this.value.groups.filter((group) => groupIds.includes(group.id))
    if (selected.length < 2) throw new Error('Select at least two groups to merge')
    const merged: SlateGroup = {
      id: `merged-${this.value.round}-${selected.map((group) => group.id).join('-')}`,
      answer: selected[0].answer,
      playerIds: [...new Set(selected.flatMap((group) => group.playerIds))],
    }
    const next = [...this.value.groups.filter((group) => !groupIds.includes(group.id)), merged]
    this.corrections.arm()
    this.corrections.propose(next)
    this.corrections.confirm()
    this.value.groups = this.corrections.snapshot.state
    this.emit()
  }

  split(groupId: string): void {
    const group = this.value.groups.find((candidate) => candidate.id === groupId)
    if (!group || group.playerIds.length < 2) throw new Error('Group cannot be split')
    const next = [
      ...this.value.groups.filter((candidate) => candidate.id !== groupId),
      ...group.playerIds.map((playerId, index) => ({
        id: `${groupId}-split-${index}`,
        answer: group.answer,
        playerIds: [playerId],
      })),
    ]
    this.corrections.arm()
    this.corrections.propose(next)
    this.corrections.confirm()
    this.value.groups = this.corrections.snapshot.state
    this.emit()
  }

  undoCorrection(): boolean {
    const undone = this.corrections.undo()
    if (undone) {
      this.value.groups = this.corrections.snapshot.state
      this.emit()
    }
    return undone
  }

  openMergeVote(): void {
    this.ballot = new BallotController(this.value.players.map((player) => player.id))
    this.value.phase = 'vote'
    this.timer = new TimedPhaseController('merge-vote', 15_000)
    this.emit()
  }

  vote(playerId: string, groupId: string, approved: boolean): void {
    this.ballot?.set(playerId, groupId, approved)
  }

  closeVote(): Map<string, number> {
    if (!this.ballot) throw new Error('No active merge vote')
    const result = this.ballot.close()
    this.value.phase = 'reveal'
    this.emit()
    return result
  }

  scoreRound(): void {
    for (const group of this.value.groups) {
      const points = group.playerIds.length > 1 ? group.playerIds.length : 0
      for (const playerId of group.playerIds) this.player(playerId).score += points
    }
    const highest = Math.max(...this.value.players.map((player) => player.score))
    const leaders = this.value.players.filter((player) => player.score === highest)
    const terminal =
      this.value.winMode === 'target-score'
        ? highest >= this.value.targetScore
        : this.value.round >= this.value.fixedRounds
    if (terminal && leaders.length === 1) {
      this.value.winnerIds = this.value.players
        .filter((player) => player.score === highest)
        .map((player) => player.id)
      this.value.phase = 'results'
      this.games.setStatus(this.currentGameId, 'complete')
    } else if (terminal) {
      this.value.phase = 'sudden-death'
      this.value.notice = 'Tie game — sudden death round'
    } else {
      this.value.phase = 'summary'
    }
    this.appendActivity('score', `Round ${this.value.round} scored`)
    this.emit()
  }

  rematch(key: string): boolean {
    const accepted = this.session.startRematch('p1', key)
    if (!accepted) return false
    this.value.targetScore = this.session.snapshot.rules.targetScore
    this.value.players = this.value.players.map((player) => ({ ...player, score: 0 }))
    this.value.winnerIds = []
    this.value.ended = false
    this.value.endConfirmationPending = false
    this.value.paused = false
    this.value.phase = 'lobby'
    const rematch = this.games.createRematch(this.currentGameId, `blankslate-${key}`)
    this.currentGameId = rematch.id
    this.emit()
    return true
  }

  proposePrompts(id: string, cues: string[], rationale: string): void {
    this.prompts.addProposal({
      id,
      collectionId: 'starter',
      items: cues.map((cue) => ({ cue })),
      rationale,
    })
  }

  reviewPromptProposal(id: string, accept: boolean): void {
    this.prompts.reviewProposal(id, 'p1', accept)
  }

  publishPrompts(): void {
    this.prompts.submit('starter', 'p1')
    this.prompts.approve('starter')
    this.prompts.publish('starter')
  }

  stageWinRules(
    patch: Partial<{
      targetScore: number
      writeMs: number
      winMode: 'target-score' | 'fixed-rounds'
      fixedRounds: number
    }>,
  ): void {
    this.session.stageRules('p1', patch)
    this.value.notice = 'Win rules staged for the next round or rematch'
    this.emit()
  }

  pause(): void {
    this.session.pause(this.session.snapshot.hostId ?? 'p1')
    this.timer.pause()
    this.value.paused = true
    this.games.setStatus(this.currentGameId, 'paused')
    this.emit()
  }

  resume(): void {
    this.session.resume(this.session.snapshot.hostId ?? 'p1')
    this.timer.resume()
    this.value.paused = false
    this.games.setStatus(this.currentGameId, 'active')
    this.emit()
  }

  recoverHost(): string {
    const current = this.session.snapshot.hostId
    if (current) this.session.setConnected(current, false)
    const next = this.session.recoverHost()
    this.value.notice = `${this.player(next).name} recovered host controls`
    this.emit()
    return next
  }

  handoffSeat(fromId: string, toId: string): void {
    this.session.handoffSeat(fromId, toId)
    this.value.notice = `${this.player(toId).name} claimed the seat`
    this.emit()
  }

  blockPlayer(playerId: string): void {
    this.session.block(this.session.snapshot.hostId ?? 'p1', playerId)
    this.value.players = this.value.players.filter((player) => player.id !== playerId)
    if (!this.value.blockedPlayerIds.includes(playerId)) this.value.blockedPlayerIds.push(playerId)
    this.emit()
  }

  unblockPlayer(playerId: string): void {
    this.session.unblock(this.session.snapshot.hostId ?? 'p1', playerId)
    this.value.blockedPlayerIds = this.value.blockedPlayerIds.filter((id) => id !== playerId)
    this.emit()
  }

  adjustScore(playerId: string, delta: number): void {
    const player = this.player(playerId)
    player.score = Math.max(0, player.score + delta)
    this.emit()
  }

  removePlayer(playerId: string): void {
    if (this.value.players.length <= 3)
      throw new Error('Blank Slate requires at least three players')
    this.value.players = this.value.players.filter((player) => player.id !== playerId)
    this.emit()
  }

  endMatch(): void {
    this.value.ended = true
    this.value.phase = 'results'
    const highScore = Math.max(...this.value.players.map((player) => player.score))
    this.value.winnerIds = this.value.players
      .filter((player) => player.score === highScore)
      .map((player) => player.id)
    this.games.setStatus(this.currentGameId, 'complete')
    this.value.endConfirmationPending = false
    this.appendActivity('match-end', 'The host ended the match')
    this.emit()
  }

  requestEndMatch(): void {
    this.value.endConfirmationPending = true
    this.emit()
  }

  cancelEndMatch(): void {
    this.value.endConfirmationPending = false
    this.emit()
  }

  confirmEndMatch(): void {
    if (!this.value.endConfirmationPending) throw new Error('End confirmation is required')
    this.endMatch()
  }

  reactToLatest(actorId: string, emoji: string): void {
    const latest = this.activity.snapshot.events.at(-1)
    if (!latest) return
    const active = !(latest.reactions[emoji] ?? []).includes(actorId)
    this.activity.react(latest.id, actorId, emoji, active)
    this.emit()
  }

  activityProjection() {
    return this.activity.publicProjection()
  }

  resultsSharePayload(): { title: string; message: string } {
    const winners = this.value.winnerIds.map((id) => this.player(id).name)
    return {
      title: 'Blank Slate results',
      message: winners.length
        ? `${winners.join(' & ')} won Blank Slate after ${this.value.round} rounds.`
        : `Blank Slate finished after ${this.value.round} rounds.`,
    }
  }

  private player(id: string): SlatePlayer {
    const player = this.value.players.find((candidate) => candidate.id === id)
    if (!player) throw new Error(`Unknown player: ${id}`)
    return player
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }

  private appendActivity(kind: string, text: string): void {
    const sequence = this.activity.snapshot.lastSequence + 1
    this.activity.append({
      id: `blankslate-activity-${sequence}`,
      sequence,
      kind,
      actorId: 'p1',
      text,
      createdAt: Date.now(),
    })
  }
}

function validateCue(item: { cue: string }): string[] {
  const blanks = item.cue.match(/___/g)?.length ?? 0
  if (blanks !== 1) return ['Cue must contain exactly one blank']
  if (item.cue.trim().length < 5 || item.cue.trim().length > 100) {
    return ['Cue must be between 5 and 100 characters']
  }
  return []
}

function createBlankSlateAccount(): AccountAuthController {
  const authenticated = {
    user: {
      id: 'blankslate-user',
      email: 'slate@example.com',
      emailVerified: true,
      displayName: 'Alex',
    },
    accessToken: 'blankslate-access',
    refreshToken: 'blankslate-refresh',
  }
  const transport: AccountAuthTransport = {
    register: async () => authenticated,
    verifyEmail: async () => authenticated,
    login: async () => authenticated,
    exchangeOAuth: async () => authenticated,
    restore: async () => authenticated,
    logout: async () => undefined,
    forgotPassword: async () => undefined,
    resetPassword: async () => undefined,
  }
  return new AccountAuthController(transport, createMemoryTokenStorage())
}

function createBlankSlatePasskeys(): PasskeyLifecycleController {
  const credentials: Awaited<ReturnType<PasskeyTransport['list']>> = []
  const transport: PasskeyTransport = {
    registrationOptions: async () => ({ challenge: 'register-blank-slate' }),
    verifyRegistration: async ({ name, platform }) => {
      const credential = {
        id: 'blankslate-passkey',
        credentialId: 'blankslate-credential',
        name,
        platform,
        createdAt: '2026-07-25T12:00:00.000Z',
      }
      credentials.splice(0, credentials.length, credential)
      return credential
    },
    loginOptions: async () => ({ challenge: 'login-blank-slate' }),
    verifyLogin: async () => ({
      user: {
        id: 'blankslate-user',
        email: 'slate@example.com',
        emailVerified: true,
        displayName: 'Alex',
      },
      accessToken: 'blankslate-passkey-access',
      refreshToken: 'blankslate-passkey-refresh',
    }),
    list: async () => structuredClone(credentials),
    remove: async (credentialId) => {
      const index = credentials.findIndex((credential) => credential.credentialId === credentialId)
      if (index >= 0) credentials.splice(index, 1)
    },
  }
  return new PasskeyLifecycleController(
    transport,
    {
      create: async () => ({ credentialId: 'blankslate-credential' }),
      get: async () => ({ credentialId: 'blankslate-credential' }),
    },
    createMemoryTokenStorage(),
  )
}

function createMemoryTokenStorage(): TokenStorage {
  let token: string | null = null
  let refreshToken: string | null = null
  return {
    getToken: async () => token,
    setToken: async (value) => {
      token = value
    },
    clearToken: async () => {
      token = null
    },
    getRefreshToken: async () => refreshToken,
    setRefreshToken: async (value) => {
      refreshToken = value
    },
    clearRefreshToken: async () => {
      refreshToken = null
    },
  }
}
