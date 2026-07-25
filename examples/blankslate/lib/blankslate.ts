import {
  BallotController,
  HostCorrectionController,
  PartySessionController,
  PrivateSubmissionController,
  TimedPhaseController,
} from '@lastshotlabs/pocketshot/party-session'

export type BlankSlatePhase =
  | 'entry'
  | 'lobby'
  | 'write'
  | 'reveal'
  | 'vote'
  | 'summary'
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
  groups: SlateGroup[]
  round: number
  targetScore: number
  winnerIds: string[]
  notice: string | null
}

export class BlankSlateController {
  private value: BlankSlateState = {
    phase: 'entry',
    prompt: 'Birthday ___',
    players: [
      { id: 'p1', name: 'Alex', score: 0 },
      { id: 'p2', name: 'Sam', score: 0 },
      { id: 'p3', name: 'Jo', score: 0 },
    ],
    submittedIds: [],
    groups: [],
    round: 0,
    targetScore: 12,
    winnerIds: [],
    notice: null,
  }
  private readonly listeners = new Set<(state: BlankSlateState) => void>()
  private readonly session = new PartySessionController({ targetScore: 12, writeMs: 30_000 })
  private submissions = new PrivateSubmissionController<string>(5_000)
  private corrections = new HostCorrectionController<SlateGroup[]>([])
  private ballot: BallotController<string> | null = null
  private timer = new TimedPhaseController('idle', 0)

  constructor() {
    this.value.players.forEach((player, seat) =>
      this.session.join({
        id: player.id,
        displayName: player.name,
        role: seat === 0 ? 'host' : 'participant',
        seat,
        connected: true,
      }),
    )
  }

  get state(): BlankSlateState {
    return structuredClone(this.value)
  }

  subscribe(listener: (state: BlankSlateState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  enter(): void {
    this.value.phase = 'lobby'
    this.emit()
  }

  startRound(): void {
    this.value.round += 1
    this.value.phase = 'write'
    this.value.submittedIds = []
    this.value.groups = []
    this.submissions = new PrivateSubmissionController<string>(5_000)
    this.corrections = new HostCorrectionController<SlateGroup[]>([])
    this.timer = new TimedPhaseController('write', 30_000)
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
    this.emit()
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
    if (highest >= this.value.targetScore) {
      this.value.winnerIds = this.value.players
        .filter((player) => player.score === highest)
        .map((player) => player.id)
      this.value.phase = 'results'
    } else {
      this.value.phase = 'summary'
    }
    this.emit()
  }

  rematch(key: string): boolean {
    const accepted = this.session.startRematch('p1', key)
    if (!accepted) return false
    this.value.players = this.value.players.map((player) => ({ ...player, score: 0 }))
    this.value.winnerIds = []
    this.value.phase = 'lobby'
    this.emit()
    return true
  }

  private player(id: string): SlatePlayer {
    const player = this.value.players.find((candidate) => candidate.id === id)
    if (!player) throw new Error(`Unknown player: ${id}`)
    return player
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }
}
