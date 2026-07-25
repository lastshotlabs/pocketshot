import {
  SecondScreenProjector,
  type PublicSecondScreenEnvelope,
} from '@lastshotlabs/pocketshot/audio'
import {
  createDurableDraft,
  createMemoryDraftStorage,
  type DraftStorage,
} from '@lastshotlabs/pocketshot/drafts'
import { RealtimeReconciler, type RealtimeEvent } from '@lastshotlabs/pocketshot/realtime'
import {
  DeckLibraryController,
  PlaybackProviderController,
  type PartyTrack,
  type PlaybackCapabilities,
} from '@lastshotlabs/pocketshot/party'
import { z } from 'zod'

export type PartyPhase = 'entry' | 'lobby' | 'round' | 'results' | 'deck'

export interface PartyState {
  phase: PartyPhase
  joinCode: string
  players: { id: string; name: string; ready: boolean }[]
  round: number
  question: string
  answer: string
  score: number
  connection: 'online' | 'reconnecting'
  hostId: string
  notice: string | null
  timeline: { id: string; year: number; title: string }[]
  activeCard: { id: string; year: number; title: string; artist: string } | null
  revealed: boolean
  tokens: number
  challenge: { challengerId: string; index: number } | null
  winner: boolean
}

type Event =
  | { kind: 'joined'; id: string; name: string }
  | { kind: 'ready'; id: string }
  | { kind: 'round'; question: string; answer: string }
  | { kind: 'score'; points: number }
  | { kind: 'results' }

const initial: PartyState = {
  phase: 'entry',
  joinCode: 'HIT-427',
  players: [],
  round: 0,
  question: '',
  answer: '',
  score: 0,
  connection: 'online',
  hostId: 'host-1',
  notice: null,
  timeline: [
    { id: 'starter-1', year: 1972, title: 'Starter 1972' },
    { id: 'starter-2', year: 1999, title: 'Starter 1999' },
  ],
  activeCard: null,
  revealed: false,
  tokens: 2,
  challenge: null,
  winner: false,
}

export class PartyDemoController {
  private stateValue = { ...initial, players: [...initial.players] }
  private cursor = 0
  private readonly answeredRounds = new Set<number>()
  private readonly listeners = new Set<(state: PartyState) => void>()
  private readonly realtime = new RealtimeReconciler<Event, PartyState>((state, event) =>
    reduceParty(state, event.payload),
  )
  private readonly display = new SecondScreenProjector<
    PartyState,
    Pick<PartyState, 'phase' | 'round' | 'question' | 'score'>
  >('party-demo', ({ phase, round, question, score }) => ({ phase, round, question, score }))

  readonly deck
  readonly deckLibrary = new DeckLibraryController()
  readonly playback = new PlaybackProviderController([])

  constructor(storage: DraftStorage = createMemoryDraftStorage()) {
    this.deckLibrary.create('friday-mix', 'Friday Mix')
    this.deck = createDurableDraft({
      id: 'party-deck',
      initialValue: { title: 'Friday Mix', cards: ['Opening track'] },
      storage,
      saveRemote: async ({ value }) => ({ value, version: 'demo-1' }),
      publishSchema: z.object({
        title: z.string().min(1),
        cards: z.array(z.string()).min(1),
      }),
    })
    this.realtime.applySnapshot({
      version: 1,
      channel: 'party-demo',
      cursor: 0,
      state: this.stateValue,
    })
  }

  importTracks(input: string): void {
    this.deckLibrary.importDelimited('friday-mix', input)
  }

  publishDeck(at: string): void {
    this.deckLibrary.submit('friday-mix')
    this.deckLibrary.approve('friday-mix')
    this.deckLibrary.publish('friday-mix', at)
  }

  deckHealth() {
    return this.deckLibrary.health('friday-mix')
  }

  providerCapabilities(): PlaybackCapabilities[] {
    return this.playback.capabilities
  }

  addTrack(track: PartyTrack): void {
    this.deckLibrary.add('friday-mix', track)
  }

  get state(): PartyState {
    return structuredClone(this.stateValue)
  }

  subscribe(listener: (state: PartyState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  guest(name: string): void {
    this.event({ kind: 'joined', id: 'guest-1', name })
    this.stateValue.phase = 'lobby'
    this.emit()
  }

  join(code: string, name: string): void {
    if (code !== this.stateValue.joinCode) {
      this.stateValue.notice = 'That join code has expired.'
      this.emit()
      return
    }
    this.guest(name)
  }

  joinFromUrl(url: string): void {
    const code = /(?:join\/|code=)([A-Z0-9-]+)/i.exec(url)?.[1]
    if (!code) {
      this.stateValue.notice = 'This party link is invalid.'
      this.emit()
      return
    }
    this.join(code.toUpperCase(), 'Linked guest')
  }

  ready(): void {
    this.event({ kind: 'ready', id: 'guest-1' })
  }

  startRound(): void {
    this.event({ kind: 'round', question: 'Name this song', answer: 'Private answer' })
    this.stateValue.activeCard = {
      id: `card-${this.stateValue.round}`,
      year: 1984,
      title: 'Private answer',
      artist: 'Private artist',
    }
    this.stateValue.revealed = false
    this.stateValue.challenge = null
    this.emit()
  }

  answer(points: number): void {
    if (this.answeredRounds.has(this.stateValue.round)) return
    this.answeredRounds.add(this.stateValue.round)
    this.event({ kind: 'score', points })
    this.event({ kind: 'results' })
  }

  rematch(): void {
    this.stateValue.phase = 'lobby'
    this.stateValue.winner = false
    this.stateValue.activeCard = null
    this.stateValue.revealed = false
    this.emit()
  }

  placeCard(index: number): boolean {
    const card = this.stateValue.activeCard
    if (!card || this.stateValue.revealed) return false
    const correct = isTimelinePlacementCorrect(this.stateValue.timeline, card.year, index)
    this.stateValue.revealed = true
    if (correct) {
      this.stateValue.timeline = [
        ...this.stateValue.timeline.slice(0, index),
        { id: card.id, year: card.year, title: card.title },
        ...this.stateValue.timeline.slice(index),
      ]
      this.stateValue.score += 1
      this.stateValue.winner = this.stateValue.timeline.length >= 10
    }
    this.emit()
    return correct
  }

  judgeNaming(correct: boolean): void {
    if (!this.stateValue.activeCard) return
    this.stateValue.tokens = Math.min(5, this.stateValue.tokens + (correct ? 1 : 0))
    this.emit()
  }

  spendTokensForCard(): boolean {
    const card = this.stateValue.activeCard
    if (!card || this.stateValue.tokens < 3 || this.stateValue.revealed) return false
    this.stateValue.tokens -= 3
    const index = insertionIndex(this.stateValue.timeline, card.year)
    this.stateValue.timeline = [
      ...this.stateValue.timeline.slice(0, index),
      { id: card.id, year: card.year, title: card.title },
      ...this.stateValue.timeline.slice(index),
    ]
    this.stateValue.score += 1
    this.stateValue.revealed = true
    this.stateValue.winner = this.stateValue.timeline.length >= 10
    this.emit()
    return true
  }

  challengePlacement(challengerId: string, index: number): void {
    if (!this.stateValue.activeCard || this.stateValue.revealed) return
    this.stateValue.challenge = { challengerId, index }
    this.emit()
  }

  resolveChallenge(originalIndex: number): 'original' | 'challenger' | 'neither' {
    const card = this.stateValue.activeCard
    const challenge = this.stateValue.challenge
    if (!card || !challenge || this.stateValue.revealed) return 'neither'
    const originalCorrect = isTimelinePlacementCorrect(
      this.stateValue.timeline,
      card.year,
      originalIndex,
    )
    const challengerCorrect = isTimelinePlacementCorrect(
      this.stateValue.timeline,
      card.year,
      challenge.index,
    )
    const winner = originalCorrect ? 'original' : challengerCorrect ? 'challenger' : 'neither'
    if (winner !== 'neither') {
      const index = winner === 'original' ? originalIndex : challenge.index
      this.stateValue.timeline = [
        ...this.stateValue.timeline.slice(0, index),
        { id: card.id, year: card.year, title: card.title },
        ...this.stateValue.timeline.slice(index),
      ]
      if (winner === 'original') this.stateValue.score += 1
    }
    this.stateValue.revealed = true
    this.stateValue.challenge = null
    this.emit()
    return winner
  }

  reconnect(): void {
    this.stateValue.connection = 'reconnecting'
    this.emit()
    queueMicrotask(() => {
      this.stateValue.connection = 'online'
      this.emit()
    })
  }

  hostDisconnect(): void {
    this.stateValue.hostId = 'guest-1'
    this.reconnect()
  }

  kickPlayer(id: string): void {
    this.stateValue.players = this.stateValue.players.filter((player) => player.id !== id)
    if (id === 'guest-1') {
      this.stateValue.phase = 'entry'
      this.stateValue.notice = 'You were removed from this party.'
    }
    this.emit()
  }

  openDeck(): void {
    this.stateValue.phase = 'deck'
    this.emit()
  }

  async renameDeck(title: string): Promise<void> {
    await this.deck.update((value) => ({ ...value, title }))
  }

  publicDisplay(): PublicSecondScreenEnvelope<
    Pick<PartyState, 'phase' | 'round' | 'question' | 'score'>
  > {
    return this.display.next(this.stateValue)
  }

  private event(payload: Event): void {
    this.cursor += 1
    const event: RealtimeEvent<Event> = {
      version: 1,
      channel: 'party-demo',
      id: `event-${this.cursor}`,
      cursor: this.cursor,
      type: payload.kind,
      timestamp: new Date().toISOString(),
      payload,
    }
    const result = this.realtime.push(event)
    if (result.state) this.stateValue = result.state
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }
}

function reduceParty(state: PartyState, event: Event): PartyState {
  if (event.kind === 'joined') {
    return {
      ...state,
      players: [...state.players, { id: event.id, name: event.name, ready: false }],
    }
  }
  if (event.kind === 'ready') {
    return {
      ...state,
      players: state.players.map((player) =>
        player.id === event.id ? { ...player, ready: true } : player,
      ),
    }
  }
  if (event.kind === 'round') {
    return {
      ...state,
      phase: 'round',
      round: state.round + 1,
      question: event.question,
      answer: event.answer,
    }
  }
  if (event.kind === 'score') return { ...state, score: state.score + event.points }
  return { ...state, phase: 'results' }
}

export function isTimelinePlacementCorrect(
  timeline: { year: number }[],
  year: number,
  index: number,
): boolean {
  if (index < 0 || index > timeline.length) return false
  const before = timeline[index - 1]?.year
  const after = timeline[index]?.year
  return (before === undefined || before <= year) && (after === undefined || year <= after)
}

function insertionIndex(timeline: { year: number }[], year: number): number {
  const index = timeline.findIndex((card) => card.year > year)
  return index === -1 ? timeline.length : index
}
