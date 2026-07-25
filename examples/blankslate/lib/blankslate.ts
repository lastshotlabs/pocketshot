import {
  BallotController,
  ContentLibraryController,
  HostCorrectionController,
  PartySessionController,
  PrivateSubmissionController,
  TimedPhaseController,
  type BallotSnapshot,
  type CorrectionSnapshot,
  type PartySessionSnapshot,
  type PrivateSubmission,
  type TimedPhaseSnapshot,
} from '@lastshotlabs/pocketshot/party-session'

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
}

export class BlankSlateController {
  private value: BlankSlateState
  private readonly session: PartySessionController<BlankSlateRules>
  private submissions: PrivateSubmissionController<string>
  private corrections: HostCorrectionController<SlateGroup[]>
  private ballot: BallotController<string> | null
  private timer: TimedPhaseController
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
  }
  private readonly listeners = new Set<(state: BlankSlateState) => void>()
  readonly prompts = new ContentLibraryController<{ cue: string }>(validateCue, (item) => item.cue)

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
    }
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
    this.value.phase = 'write'
    this.value.submittedIds = []
    this.value.submissionStates = {}
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
    } else if (terminal) {
      this.value.phase = 'sudden-death'
      this.value.notice = 'Tie game — sudden death round'
    } else {
      this.value.phase = 'summary'
    }
    this.emit()
  }

  rematch(key: string): boolean {
    const accepted = this.session.startRematch('p1', key)
    if (!accepted) return false
    this.value.targetScore = this.session.snapshot.rules.targetScore
    this.value.players = this.value.players.map((player) => ({ ...player, score: 0 }))
    this.value.winnerIds = []
    this.value.ended = false
    this.value.paused = false
    this.value.phase = 'lobby'
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
    this.emit()
  }

  resume(): void {
    this.session.resume(this.session.snapshot.hostId ?? 'p1')
    this.timer.resume()
    this.value.paused = false
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
    this.emit()
  }

  unblockPlayer(playerId: string): void {
    this.session.unblock(this.session.snapshot.hostId ?? 'p1', playerId)
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
    this.emit()
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

function validateCue(item: { cue: string }): string[] {
  const blanks = item.cue.match(/___/g)?.length ?? 0
  if (blanks !== 1) return ['Cue must contain exactly one blank']
  if (item.cue.trim().length < 5 || item.cue.trim().length > 100) {
    return ['Cue must be between 5 and 100 characters']
  }
  return []
}
