import {
  SecondScreenProjector,
  type PublicSecondScreenEnvelope,
} from '@lastshotlabs/pocketshot/audio'
import { createDurableDraft, createMemoryDraftStorage } from '@lastshotlabs/pocketshot/drafts'
import { RealtimeReconciler, type RealtimeEvent } from '@lastshotlabs/pocketshot/realtime'
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

  readonly deck = createDurableDraft({
    id: 'party-deck',
    initialValue: { title: 'Friday Mix', cards: ['Opening track'] },
    storage: createMemoryDraftStorage(),
    saveRemote: async ({ value }) => ({ value, version: 'demo-1' }),
    publishSchema: z.object({
      title: z.string().min(1),
      cards: z.array(z.string()).min(1),
    }),
  })

  constructor() {
    this.realtime.applySnapshot({
      version: 1,
      channel: 'party-demo',
      cursor: 0,
      state: this.stateValue,
    })
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

  ready(): void {
    this.event({ kind: 'ready', id: 'guest-1' })
  }

  startRound(): void {
    this.event({ kind: 'round', question: 'Name this song', answer: 'Private answer' })
  }

  answer(points: number): void {
    if (this.answeredRounds.has(this.stateValue.round)) return
    this.answeredRounds.add(this.stateValue.round)
    this.event({ kind: 'score', points })
    this.event({ kind: 'results' })
  }

  rematch(): void {
    this.stateValue.phase = 'lobby'
    this.emit()
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
