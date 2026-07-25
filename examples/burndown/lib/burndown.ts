import {
  BallotController,
  ContentLibraryController,
  PartySessionController,
  PersonalCuePolicy,
  SharedDeviceController,
  TimedPhaseController,
  type PartySessionSnapshot,
  type SharedDeviceSnapshot,
  type TimedPhaseSnapshot,
} from '@lastshotlabs/pocketshot/party-session'

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
  round: number
  notice: string | null
  paused: boolean
  winnerId: string | null
  ended: boolean
}

type BurndownRules = { lives: number; turnMs: number; challenge: boolean }

export interface BurndownSnapshot {
  state: BurndownState
  session: PartySessionSnapshot<BurndownRules>
  shared: SharedDeviceSnapshot
  timer: TimedPhaseSnapshot
  commandKeys: string[]
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export class BurndownController {
  private value: BurndownState
  private readonly session: PartySessionController<BurndownRules>
  private readonly shared: SharedDeviceController
  private timer: TimedPhaseController
  private commandKeys: Set<string>
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
    round: 0,
    notice: null,
    paused: false,
    winnerId: null,
    ended: false,
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

  constructor(snapshot?: BurndownSnapshot) {
    this.value = structuredClone(snapshot?.state ?? this.initialState)
    this.session = new PartySessionController(
      { lives: 3, turnMs: 20_000, challenge: true },
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
    if (!snapshot) {
      this.session.join({
        id: 'p1',
        displayName: 'Alex',
        role: 'host',
        seat: 0,
        connected: true,
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
    this.emit()
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

  start(): void {
    this.value.round = 1
    this.value.letter = alphabet[0]
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
    if (this.value.mode === 'shared') this.shared.settleCommand(idempotencyKey)
    this.advanceTurn()
    return true
  }

  openChallenge(): void {
    this.challenge = new BallotController(
      this.value.players.filter((player) => !player.eliminated).map((player) => player.id),
    )
    this.value.phase = 'challenge'
    this.timer = new TimedPhaseController('challenge', 10_000)
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
    this.emit()
  }

  resume(): void {
    this.session.resume('p1')
    this.timer.resume()
    this.value.paused = false
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
    this.value.winnerId = null
    this.value.ended = false
    this.value.phase = 'lobby'
    this.value.notice = null
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
      winnerId: this.value.winnerId,
      ended: this.value.ended,
    }
  }

  stageRules(patch: Partial<{ lives: number; turnMs: number; challenge: boolean }>): void {
    this.session.stageRules(this.session.snapshot.hostId ?? 'p1', patch)
    this.value.notice = 'Rule changes staged for the next round or rematch'
    this.emit()
  }

  get rules() {
    return structuredClone(this.session.snapshot.rules)
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
    this.emit()
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

  private beginTurn(id: string): void {
    this.value.activePlayerId = id
    this.timer = new TimedPhaseController('turn', 20_000)
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
      this.emit()
      return
    }
    const index = alive.findIndex((player) => player.id === this.value.activePlayerId)
    const next = alive[(index + 1) % alive.length]
    if (next.id === alive[0].id) {
      this.value.round += 1
      const available = alphabet.filter(
        (letter) => !this.value.burned.includes(letter.toLowerCase()),
      )
      this.value.letter = available[(this.value.round - 1) % available.length] ?? 'A'
    }
    this.beginTurn(next.id)
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
}
