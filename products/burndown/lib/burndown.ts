import {
  BallotController,
  ContentLibraryController,
  GameDashboardController,
  PartyActivityController,
  PartySessionController,
  PersonalCuePolicy,
  SharedDeviceController,
  TimedPhaseController,
  type PartySessionSnapshot,
  type SharedDeviceSnapshot,
  type TimedPhaseSnapshot,
  type GameDashboardSnapshot,
  type PartyActivitySnapshot,
} from '@lastshotlabs/pocketshot/party-session'
import {
  AccountAuthController,
  PasskeyLifecycleController,
  type AccountAuthTransport,
  type PasskeyTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'

export type BurndownMode = 'phones' | 'shared'
export type BurndownPhase =
  | 'entry'
  | 'lobby'
  | 'handoff'
  | 'turn'
  | 'challenge'
  | 'summary'
  | 'results'

export interface BurndownPlayer {
  id: string
  name: string
  seat: number
  lives: number
  eliminated: boolean
}

export interface BurndownState {
  phase: BurndownPhase
  mode: BurndownMode
  joinCode: string
  category: string
  letter: string
  activePlayerId: string
  players: BurndownPlayer[]
  burned: string[]
  burnedLetters: string[]
  voidLetters: string[]
  round: number
  notice: string | null
  paused: boolean
  winnerId: string | null
  ended: boolean
  endConfirmationPending: boolean
  identityStatus: 'guest' | 'account' | 'passkey'
  identityEmail: string | null
  passkeyCount: number
}

type BurndownRules = {
  lives: number
  turnMs: number
  warningMs: number
  speedUpMs: number
  challenge: boolean
  challengeMs: number
  challengeMode: 'overlap' | 'serialized'
  boardExhaustion: 'end' | 'reset'
  hostParticipates: boolean
}

export interface BurndownSnapshot {
  state: BurndownState
  session: PartySessionSnapshot<BurndownRules>
  shared: SharedDeviceSnapshot
  timer: TimedPhaseSnapshot
  commandKeys: string[]
  dashboard: GameDashboardSnapshot
  activity?: PartyActivitySnapshot
  currentGameId: string
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export class BurndownController {
  private value: BurndownState
  private readonly session: PartySessionController<BurndownRules>
  private readonly shared: SharedDeviceController
  private timer: TimedPhaseController
  private commandKeys: Set<string>
  private currentGameId: string
  private readonly activity: PartyActivityController
  private readonly initialState: BurndownState = {
    phase: 'entry',
    mode: 'phones',
    joinCode: 'BURN-42',
    category: 'Things at the beach',
    letter: 'A',
    activePlayerId: 'p1',
    players: [
      { id: 'p1', name: 'Alex', seat: 0, lives: 3, eliminated: false },
      { id: 'p2', name: 'Sam', seat: 1, lives: 3, eliminated: false },
    ],
    burned: [],
    burnedLetters: [],
    voidLetters: [],
    round: 0,
    notice: null,
    paused: false,
    winnerId: null,
    ended: false,
    endConfirmationPending: false,
    identityStatus: 'guest',
    identityEmail: null,
    passkeyCount: 0,
  }
  private readonly listeners = new Set<(state: BurndownState) => void>()
  private readonly cues = new PersonalCuePolicy()
  private challenge: BallotController<'valid' | 'invalid' | 'nobody'> | null = null
  readonly categories = new ContentLibraryController<{ category: string }>(
    (item) =>
      item.category.trim().length >= 3 && item.category.trim().length <= 80
        ? []
        : ['Category must be between 3 and 80 characters'],
    (item) => item.category,
  )
  readonly games: GameDashboardController
  readonly account = createBurndownAccount()
  readonly passkeys = createBurndownPasskeys()

  constructor(snapshot?: BurndownSnapshot) {
    this.value = structuredClone(snapshot?.state ?? this.initialState)
    this.session = new PartySessionController(
      {
        lives: 3,
        turnMs: 20_000,
        warningMs: 5_000,
        speedUpMs: 1_000,
        challenge: true,
        challengeMs: 10_000,
        challengeMode: 'serialized',
        boardExhaustion: 'end',
        hostParticipates: true,
      },
      snapshot?.session,
    )
    this.shared = new SharedDeviceController(snapshot?.shared)
    this.timer = new TimedPhaseController(
      snapshot?.timer.phase ?? 'idle',
      0,
      Date.now,
      snapshot?.timer,
    )
    this.commandKeys = new Set(snapshot?.commandKeys ?? [])
    this.currentGameId = snapshot?.currentGameId ?? 'burndown-game-1'
    this.games = new GameDashboardController(snapshot?.dashboard)
    this.activity = new PartyActivityController(snapshot?.activity)
    if (!snapshot) {
      this.session.join({
        id: 'p1',
        displayName: 'Alex',
        role: 'host',
        seat: 0,
        connected: true,
      })
      this.games.upsert({
        id: this.currentGameId,
        product: 'burndown',
        title: 'Burndown match',
        status: 'lobby',
        joinCode: this.value.joinCode,
        resumable: true,
      })
      this.session.join({
        id: 'p2',
        displayName: 'Sam',
        role: 'participant',
        seat: 1,
        connected: true,
      })
    }
    this.categories.create('starter', 'p1', 'Starter categories')
    this.categories.appendItems('starter', 'p1', 1, [
      { category: 'Things at the beach' },
      { category: 'Movie titles' },
      { category: 'Foods in a kitchen' },
    ])
  }

  get state(): BurndownState {
    return structuredClone(this.value)
  }

  get sharedState() {
    return this.shared.snapshot
  }

  exportSnapshot(): BurndownSnapshot {
    return {
      state: this.state,
      session: this.session.snapshot,
      shared: this.shared.snapshot,
      timer: this.timer.snapshot,
      commandKeys: [...this.commandKeys],
      dashboard: this.games.snapshot,
      currentGameId: this.currentGameId,
      activity: this.activity.snapshot,
    }
  }

  subscribe(listener: (state: BurndownState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  enter(mode: BurndownMode): void {
    this.value.mode = mode
    this.value.phase = 'lobby'
    this.games.setStatus(this.currentGameId, 'lobby')
    this.emit()
  }

  async signInOAuth(provider: 'apple' | 'google', mode: BurndownMode = 'phones'): Promise<void> {
    await this.account.completeOAuth(
      provider,
      'demo-code',
      `pocketshot-burndown://oauth/${provider}`,
    )
    this.value.identityStatus = 'account'
    this.value.identityEmail = this.account.snapshot.user?.email ?? null
    this.enter(mode)
  }

  async signOutAccount(): Promise<void> {
    await this.account.logout()
    this.value.identityStatus = 'guest'
    this.value.identityEmail = null
    this.emit()
  }

  async registerPasskey(platform: 'ios' | 'android'): Promise<void> {
    await this.passkeys.register('Burndown phone', platform)
    this.value.passkeyCount = this.passkeys.snapshot.credentials.length
    this.emit()
  }

  async signInPasskey(mode: BurndownMode = 'phones'): Promise<void> {
    await this.passkeys.login()
    this.value.identityStatus = 'passkey'
    this.value.identityEmail = this.passkeys.snapshot.user?.email ?? null
    this.value.passkeyCount = this.passkeys.snapshot.credentials.length
    this.enter(mode)
  }

  join(code: string, mode: BurndownMode = 'phones'): boolean {
    if (code.trim().toLocaleUpperCase() !== this.value.joinCode) {
      this.value.notice = 'That Burndown invite is invalid or expired'
      this.emit()
      return false
    }
    this.enter(mode)
    return true
  }

  setAdmissionPolicy(policy: 'open' | 'approval' | 'closed'): void {
    this.session.setAdmissionPolicy(this.session.snapshot.hostId ?? 'p1', policy)
    this.emit()
  }

  requestAdmission(
    id: string,
    displayName: string,
    role: 'participant' | 'spectator' | 'emcee' = 'participant',
  ): 'admitted' | 'pending' {
    const result = this.session.requestAdmission({
      id,
      displayName,
      role,
      requestedAt: Date.now(),
    })
    this.value.notice =
      result === 'pending'
        ? `${displayName} is waiting for host approval`
        : `${displayName} may join`
    this.emit()
    return result
  }

  decideAdmission(id: string, admit: boolean): void {
    const request = this.session.snapshot.admissionQueue?.find((candidate) => candidate.id === id)
    if (!request) throw new Error(`Unknown admission request: ${id}`)
    this.session.decideAdmission(this.session.snapshot.hostId ?? 'p1', id, admit)
    if (admit) {
      const seat =
        request.role === 'spectator'
          ? null
          : Math.max(-1, ...this.session.snapshot.members.map((member) => member.seat ?? -1)) + 1
      this.session.join({
        id: request.id,
        displayName: request.displayName,
        role: request.role,
        seat,
        connected: true,
      })
      if (seat !== null && !this.value.players.some((player) => player.id === request.id)) {
        this.value.players.push({
          id: request.id,
          name: request.displayName,
          seat,
          lives: this.session.snapshot.rules.lives,
          eliminated: false,
        })
      }
    }
    this.value.notice = admit ? 'Waiting guest admitted' : 'Waiting guest declined'
    this.emit()
  }

  admissionQueue() {
    return this.session.snapshot.admissionQueue
  }

  lobbyProjection() {
    return this.session.publicProjection()
  }

  configureSharedTable(playerCount: number): void {
    if (this.value.phase !== 'entry' && this.value.phase !== 'lobby') {
      throw new Error('Shared-table seats can only be configured before a match')
    }
    if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 8) {
      throw new Error('Shared-table player count must be between 2 and 8')
    }
    const names = ['Alex', 'Sam', 'Jo', 'Rae', 'Morgan', 'Drew', 'Kai', 'Lee']
    for (let seat = this.value.players.length; seat < playerCount; seat += 1) {
      const player = {
        id: `p${seat + 1}`,
        name: names[seat],
        seat,
        lives: this.session.snapshot.rules.lives,
        eliminated: false,
      }
      this.value.players.push(player)
      this.session.join({
        id: player.id,
        displayName: player.name,
        role: 'participant',
        seat,
        connected: true,
      })
    }
    this.value.mode = 'shared'
    this.value.notice = `${this.value.players.length}-player shared table ready`
    this.emit()
  }

  start(): void {
    this.session.applyStagedRules()
    const rules = this.session.snapshot.rules
    this.value.players = this.value.players.map((player) => ({
      ...player,
      lives: rules.lives,
      eliminated: false,
    }))
    this.value.round = 1
    this.games.setStatus(this.currentGameId, 'active')
    this.value.letter = alphabet[0]
    this.appendActivity('match-start', 'Burndown match started')
    this.beginTurn('p1')
  }

  revealHandoff(): void {
    if (this.value.mode !== 'shared') return
    this.shared.arm(this.activePlayer().seat)
    this.value.phase = 'turn'
    this.emit()
  }

  burn(word: string, idempotencyKey: string): boolean {
    const normalized = word.trim().toLocaleLowerCase()
    if (!normalized.startsWith(this.value.letter.toLocaleLowerCase())) {
      this.value.notice = `Word must start with ${this.value.letter}`
      this.emit()
      return false
    }
    if (this.commandKeys.has(idempotencyKey)) return false
    if (this.value.burned.includes(normalized)) {
      this.value.notice = 'That word was already burned'
      this.emit()
      return false
    }
    if (this.value.mode === 'shared' && !this.shared.lockCommand(idempotencyKey)) return false
    this.commandKeys.add(idempotencyKey)
    this.value.burned.push(normalized)
    if (!this.value.burnedLetters.includes(this.value.letter)) {
      this.value.burnedLetters.push(this.value.letter)
    }
    this.appendActivity('burn', `${this.activePlayer().name} burned ${normalized}`)
    if (this.value.mode === 'shared') this.shared.settleCommand(idempotencyKey)
    this.advanceTurn()
    return true
  }

  openChallenge(): void {
    if (!this.session.snapshot.rules.challenge) throw new Error('Challenges are disabled')
    this.challenge = new BallotController(
      this.value.players.filter((player) => !player.eliminated).map((player) => player.id),
    )
    this.value.phase = 'challenge'
    this.timer = new TimedPhaseController('challenge', this.session.snapshot.rules.challengeMs)
    this.appendActivity('challenge', `${this.activePlayer().name}'s answer was challenged`)
    this.emit()
  }

  vote(voterId: string, choice: 'valid' | 'invalid' | 'nobody'): void {
    this.challenge?.set(voterId, choice, true)
    this.emit()
  }

  resolveChallenge(): 'valid' | 'invalid' | 'nobody' {
    if (!this.challenge) throw new Error('No active challenge')
    const totals = this.challenge.close()
    const outcome = (['invalid', 'valid', 'nobody'] as const).reduce((best, choice) =>
      (totals.get(choice) ?? 0) > (totals.get(best) ?? 0) ? choice : best,
    )
    if (outcome === 'invalid' || outcome === 'nobody') this.loseLife(this.value.activePlayerId)
    this.challenge = null
    this.advanceTurn()
    return outcome
  }

  timeout(): void {
    this.loseLife(this.value.activePlayerId)
    this.advanceTurn()
  }

  pause(): void {
    this.session.pause('p1')
    this.timer.pause()
    this.value.paused = true
    this.games.setStatus(this.currentGameId, 'paused')
    this.emit()
  }

  resume(): void {
    this.session.resume('p1')
    this.timer.resume()
    this.value.paused = false
    this.games.setStatus(this.currentGameId, 'active')
    this.emit()
  }

  recoverHost(): string {
    this.session.setConnected('p1', false)
    const next = this.session.recoverHost()
    this.value.notice = `${this.player(next).name} recovered host controls`
    this.emit()
    return next
  }

  rematch(key: string): boolean {
    const hostId = this.session.snapshot.hostId ?? 'p1'
    const started = this.session.startRematch(hostId, key)
    if (!started) return false
    const { lives } = this.session.snapshot.rules
    this.value.players = this.value.players.map((player) => ({
      ...player,
      lives,
      eliminated: false,
    }))
    this.value.burned = []
    this.value.burnedLetters = []
    this.value.voidLetters = []
    this.value.winnerId = null
    this.value.ended = false
    this.value.endConfirmationPending = false
    this.value.phase = 'lobby'
    this.value.notice = null
    const rematch = this.games.createRematch(this.currentGameId, `burndown-${key}`)
    this.currentGameId = rematch.id
    this.emit()
    return true
  }

  projection() {
    return {
      phase: this.value.phase,
      category: this.value.category,
      letter: this.value.letter,
      players: this.value.players.map(({ id, name, lives, eliminated }) => ({
        id,
        name,
        lives,
        eliminated,
      })),
      burnedCount: this.value.burned.length,
      board: this.board(),
      winnerId: this.value.winnerId,
      ended: this.value.ended,
    }
  }

  stageRules(patch: Partial<BurndownRules>): void {
    validateRules({ ...this.session.snapshot.rules, ...patch })
    this.session.stageRules(this.session.snapshot.hostId ?? 'p1', patch)
    this.value.notice = 'Rule changes staged for the next round or rematch'
    this.emit()
  }

  get rules() {
    return structuredClone(this.session.snapshot.rules)
  }

  board(): Array<{ letter: string; status: 'alive' | 'active' | 'burned' | 'void' }> {
    return alphabet.map((letter) => ({
      letter,
      status: this.value.voidLetters.includes(letter)
        ? 'void'
        : this.value.burnedLetters.includes(letter)
          ? 'burned'
          : letter === this.value.letter
            ? 'active'
            : 'alive',
    }))
  }

  voidLetter(letter: string): void {
    const normalized = letter.trim().toLocaleUpperCase()
    if (!alphabet.includes(normalized)) throw new Error('Letter must be A through Z')
    if (!this.value.voidLetters.includes(normalized)) this.value.voidLetters.push(normalized)
    this.value.burnedLetters = this.value.burnedLetters.filter((item) => item !== normalized)
    if (this.value.letter === normalized) this.advanceLetter()
    this.emit()
  }

  isWarning(): boolean {
    return this.timer.isWarning(this.session.snapshot.rules.warningMs)
  }

  remainingMs(): number {
    return this.timer.remainingMs()
  }

  adjustLives(playerId: string, delta: number): void {
    const player = this.player(playerId)
    player.lives = Math.max(0, player.lives + delta)
    player.eliminated = player.lives === 0
    this.emit()
  }

  removePlayer(playerId: string): void {
    if (this.value.players.length <= 2) throw new Error('A match requires at least two players')
    this.value.players = this.value.players.filter((player) => player.id !== playerId)
    if (this.value.activePlayerId === playerId) this.beginTurn(this.value.players[0].id)
    else this.emit()
  }

  endMatch(): void {
    this.value.ended = true
    this.value.phase = 'results'
    this.shared.end()
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
    const winner = this.value.winnerId ? this.player(this.value.winnerId).name : null
    return {
      title: 'Burndown results',
      message: winner
        ? `${winner} won Burndown after ${this.value.round} rounds.`
        : `Burndown finished after ${this.value.round} rounds.`,
    }
  }

  proposeCategories(id: string, categories: string[], rationale: string): void {
    this.categories.addProposal({
      id,
      collectionId: 'starter',
      items: categories.map((category) => ({ category })),
      rationale,
    })
  }

  reviewCategoryProposal(id: string, accept: boolean): void {
    this.categories.reviewProposal(id, 'p1', accept)
  }

  publishCategories(): void {
    this.categories.submit('starter', 'p1')
    this.categories.approve('starter')
    this.categories.publish('starter')
  }

  bulkAddCategories(input: string): void {
    const categories = input
      .split(/\r?\n/)
      .map((category) => category.trim())
      .filter(Boolean)
      .map((category) => ({ category }))
    if (!categories.length) throw new Error('Bulk category input cannot be empty')
    const collection = this.categories.snapshot.find((candidate) => candidate.id === 'starter')
    if (!collection) throw new Error('Starter category deck is unavailable')
    this.categories.appendItems('starter', 'p1', collection.revision, categories)
    this.value.notice = `${categories.length} bulk categories added`
    this.emit()
  }

  renameCategoryDeck(title: string): void {
    const collection = this.categories.snapshot.find((candidate) => candidate.id === 'starter')
    if (!collection) throw new Error('Starter category deck is unavailable')
    this.categories.updateMetadata('starter', 'p1', collection.revision, { title })
    this.value.notice = 'Category deck autosaved'
    this.emit()
  }

  duplicateCategoryDeck(): void {
    if (!this.categories.snapshot.some((candidate) => candidate.id === 'starter-copy')) {
      this.categories.duplicate('starter', 'starter-copy', 'p1', 'Starter categories copy')
    }
    this.value.notice = 'Category deck duplicated'
    this.emit()
  }

  archiveCategoryDeck(id = 'starter-copy'): void {
    this.categories.archive(id, 'p1')
    this.value.notice = 'Category deck archived'
    this.emit()
  }

  private beginTurn(id: string): void {
    this.value.activePlayerId = id
    const rules = this.session.snapshot.rules
    const duration = Math.max(3_000, rules.turnMs - (this.value.round - 1) * rules.speedUpMs)
    this.timer = new TimedPhaseController('turn', duration)
    if (this.value.mode === 'shared') {
      this.shared.begin(this.player(id).seat)
      this.value.phase = 'handoff'
    } else {
      this.value.phase = 'turn'
    }
    this.cues.shouldDeliver(
      {
        roomId: this.value.joinCode,
        eventId: `turn-${this.value.round}-${id}`,
        actorId: id,
        recipientId: id,
        at: Date.now(),
      },
      'active',
    )
    this.emit()
  }

  private advanceTurn(): void {
    const alive = this.value.players.filter((player) => !player.eliminated)
    if (alive.length <= 1) {
      this.value.winnerId = alive[0]?.id ?? null
      this.value.phase = 'results'
      this.shared.end()
      this.games.setStatus(this.currentGameId, 'complete')
      this.emit()
      return
    }
    if (!this.advanceLetter()) return
    const index = alive.findIndex((player) => player.id === this.value.activePlayerId)
    const next = alive[(index + 1) % alive.length]
    if (next.id === alive[0].id) {
      this.value.round += 1
    }
    this.beginTurn(next.id)
  }

  private advanceLetter(): boolean {
    const currentIndex = alphabet.indexOf(this.value.letter)
    for (let offset = 1; offset <= alphabet.length; offset += 1) {
      const candidate = alphabet[(currentIndex + offset) % alphabet.length]
      if (
        !this.value.burnedLetters.includes(candidate) &&
        !this.value.voidLetters.includes(candidate)
      ) {
        this.value.letter = candidate
        return true
      }
    }
    if (this.session.snapshot.rules.boardExhaustion === 'reset') {
      this.value.burnedLetters = []
      this.value.voidLetters = []
      this.value.round += 1
      this.value.letter = 'A'
      this.value.notice = 'Board reset for a new round'
      return true
    }
    this.value.ended = true
    this.value.phase = 'results'
    const alive = this.value.players.filter((player) => !player.eliminated)
    this.value.winnerId =
      [...alive].sort((left, right) => right.lives - left.lives || left.seat - right.seat)[0]?.id ??
      null
    this.shared.end()
    this.games.setStatus(this.currentGameId, 'complete')
    this.emit()
    return false
  }

  private loseLife(id: string): void {
    const player = this.player(id)
    player.lives = Math.max(0, player.lives - 1)
    player.eliminated = player.lives === 0
  }

  private activePlayer(): BurndownPlayer {
    return this.player(this.value.activePlayerId)
  }

  private player(id: string): BurndownPlayer {
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
      id: `burndown-activity-${sequence}`,
      sequence,
      kind,
      actorId: this.value.activePlayerId,
      text,
      createdAt: Date.now(),
    })
  }
}

function createBurndownAccount(): AccountAuthController {
  let accessToken: string | null = null
  let refreshToken: string | null = null
  const storage: TokenStorage = {
    getToken: async () => accessToken,
    setToken: async (value) => {
      accessToken = value
    },
    clearToken: async () => {
      accessToken = null
    },
    getRefreshToken: async () => refreshToken,
    setRefreshToken: async (value) => {
      refreshToken = value
    },
    clearRefreshToken: async () => {
      refreshToken = null
    },
  }
  const authenticated = {
    user: {
      id: 'burndown-user',
      email: 'burn@example.com',
      emailVerified: true,
      displayName: 'Alex',
    },
    accessToken: 'burndown-access',
    refreshToken: 'burndown-refresh',
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
  return new AccountAuthController(transport, storage)
}

function createBurndownPasskeys(): PasskeyLifecycleController {
  const credentials: Awaited<ReturnType<PasskeyTransport['list']>> = []
  const transport: PasskeyTransport = {
    registrationOptions: async () => ({ challenge: 'register-burndown' }),
    verifyRegistration: async ({ name, platform }) => {
      const credential = {
        id: 'burndown-passkey',
        credentialId: 'burndown-credential',
        name,
        platform,
        createdAt: '2026-07-25T12:00:00.000Z',
      }
      credentials.splice(0, credentials.length, credential)
      return credential
    },
    loginOptions: async () => ({ challenge: 'login-burndown' }),
    verifyLogin: async () => ({
      user: {
        id: 'burndown-user',
        email: 'burn@example.com',
        emailVerified: true,
        displayName: 'Alex',
      },
      accessToken: 'burndown-passkey-access',
      refreshToken: 'burndown-passkey-refresh',
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
      create: async () => ({ credentialId: 'burndown-credential' }),
      get: async () => ({ credentialId: 'burndown-credential' }),
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

function validateRules(rules: BurndownRules): void {
  if (!Number.isInteger(rules.lives) || rules.lives < 1 || rules.lives > 20) {
    throw new Error('Lives must be between 1 and 20')
  }
  if (rules.turnMs < 3_000 || rules.warningMs < 0 || rules.warningMs >= rules.turnMs) {
    throw new Error('Turn and warning timing is invalid')
  }
  if (rules.speedUpMs < 0 || rules.speedUpMs >= rules.turnMs) {
    throw new Error('Round speed-up timing is invalid')
  }
  if (rules.challengeMs < 1_000) throw new Error('Challenge window must be at least one second')
}
