import {
  SecondScreenProjector,
  type PublicSecondScreenEnvelope,
} from '@lastshotlabs/pocketshot/audio'
import {
  AccountAuthController,
  type AccountAuthTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'
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
  type PlaybackProvider,
} from '@lastshotlabs/pocketshot/party'
import {
  PartyActivityController,
  PartySessionController,
  type PartyActivitySnapshot,
  type PartySessionSnapshot,
} from '@lastshotlabs/pocketshot/party-session'
import { z } from 'zod'

export type PartyPhase = 'entry' | 'lobby' | 'round' | 'results' | 'deck'
export type PartyPreset = 'classic' | 'pro' | 'expert' | 'cutthroat'

export interface PartyMatchSettings {
  preset: PartyPreset | 'custom'
  targetCards: number
  namingRequired: boolean
  challenges: boolean
  steals: boolean
  soloTeams: boolean
  tokenCap: number
  freeCardCost: number
}

export interface PartyState {
  phase: PartyPhase
  joinCode: string
  players: { id: string; name: string; ready: boolean; teamId: string | null }[]
  teams: { id: string; name: string; score: number }[]
  settings: PartyMatchSettings
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
  playbackCapabilities: PlaybackCapabilities[]
  playbackSource: string | null
  accountStatus: 'anonymous' | 'authenticated'
  accountEmail: string | null
  paused: boolean
  muted: boolean
  ended: boolean
  endConfirmationPending: boolean
  activityCount: number
  deckExport: string | null
  deckAction: string | null
}

export interface HitshotSnapshot {
  state: PartyState
  session: PartySessionSnapshot<{ targetCards: number }>
  activity: PartyActivitySnapshot
  cursor: number
  answeredRounds: number[]
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
  teams: [
    { id: 'team-1', name: 'Team One', score: 0 },
    { id: 'team-2', name: 'Team Two', score: 0 },
  ],
  settings: {
    preset: 'classic',
    targetCards: 10,
    namingRequired: false,
    challenges: true,
    steals: false,
    soloTeams: false,
    tokenCap: 5,
    freeCardCost: 3,
  },
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
  playbackCapabilities: [],
  playbackSource: null,
  accountStatus: 'anonymous',
  accountEmail: null,
  paused: false,
  muted: false,
  ended: false,
  endConfirmationPending: false,
  activityCount: 0,
  deckExport: null,
  deckAction: null,
}

export class PartyDemoController {
  private stateValue: PartyState
  private cursor = 0
  private readonly answeredRounds: Set<number>
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
  readonly playback = new PlaybackProviderController([
    createDemoProvider('spotify', false, 'full'),
    createDemoProvider('audius', true, 'preview'),
  ])
  readonly account = createDemoPartyAccount()
  readonly session: PartySessionController<{ targetCards: number }>
  readonly activity: PartyActivityController

  constructor(storage: DraftStorage = createMemoryDraftStorage(), snapshot?: HitshotSnapshot) {
    this.stateValue = structuredClone(snapshot?.state ?? initial)
    this.cursor = snapshot?.cursor ?? 0
    this.answeredRounds = new Set(snapshot?.answeredRounds ?? [])
    this.session = new PartySessionController(
      { targetCards: initial.settings.targetCards },
      snapshot?.session,
    )
    this.activity = new PartyActivityController(snapshot?.activity)
    if (!snapshot) {
      this.session.join({
        id: 'host-1',
        displayName: 'Host',
        role: 'host',
        seat: 0,
        connected: true,
      })
    }
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
    this.syncPlaybackCapabilities()
  }

  exportSnapshot(): HitshotSnapshot {
    return {
      state: this.state,
      session: this.session.snapshot,
      activity: this.activity.snapshot,
      cursor: this.cursor,
      answeredRounds: [...this.answeredRounds],
    }
  }

  importTracks(input: string): void {
    this.deckLibrary.importDelimited('friday-mix', input)
    this.emit()
  }

  async importDemoPlaylist(reference = 'spotify:playlist:demo'): Promise<void> {
    await this.deckLibrary.importPlaylist('friday-mix', reference, {
      importPlaylist: async () => [
        {
          id: 'playlist-track',
          title: 'Playlist Track',
          artist: 'Imported Artist',
          year: 2004,
          providerIds: { spotify: 'playlist-track' },
          previewUrl: null,
        },
      ],
    })
    this.stateValue.deckAction = 'Playlist imported'
    this.emit()
  }

  async searchAndAddTrack(query: string): Promise<void> {
    const [track] = await this.playback.search(query)
    if (!track) {
      this.stateValue.deckAction = 'No provider result'
      this.emit()
      return
    }
    this.deckLibrary.add('friday-mix', track)
    this.stateValue.deckAction = `Added ${track.title}`
    this.emit()
  }

  async auditionFirstTrack(): Promise<void> {
    const tracks = this.deckLibrary.snapshot[0]?.tracks ?? []
    if (!tracks.length) throw new Error('Add a track before auditioning')
    let resolved: Awaited<ReturnType<PlaybackProviderController['resolve']>> = null
    for (const track of tracks) {
      resolved = await this.playback.resolve(track, 'spotify')
      if (resolved) break
    }
    this.stateValue.playbackSource = resolved ? `${resolved.provider}:${resolved.kind}` : null
    this.stateValue.deckAction = resolved
      ? `Auditioning via ${resolved.provider}`
      : 'Track unavailable'
    this.emit()
  }

  correctFirstTrackYear(year: number): void {
    const track = this.deckLibrary.snapshot[0]?.tracks[0]
    if (!track) throw new Error('Add a track before correcting its year')
    this.deckLibrary.correctYear('friday-mix', track.id, year)
    this.stateValue.deckAction = `Year corrected to ${year}`
    this.emit()
  }

  combineDemoDeck(): void {
    if (!this.deckLibrary.snapshot.some((deck) => deck.id === 'party-favorites')) {
      this.deckLibrary.create('party-favorites', 'Party Favorites')
      this.deckLibrary.add('party-favorites', {
        id: 'favorite-track',
        title: 'Favorite Track',
        artist: 'Party Artist',
        year: 1998,
        providerIds: { audius: 'favorite-track' },
        previewUrl: 'https://preview.example.test/favorite.mp3',
      })
    }
    this.deckLibrary.combine('friday-mix', ['party-favorites'])
    this.stateValue.deckAction = 'Combined Party Favorites'
    this.emit()
  }

  replaceFirstTrack(): void {
    const track = this.deckLibrary.snapshot.find((deck) => deck.id === 'friday-mix')?.tracks[0]
    if (!track) throw new Error('Add a track before replacing it')
    this.deckLibrary.replace('friday-mix', track.id, {
      id: `replacement-${track.id}`,
      title: 'Replacement Track',
      artist: 'Replacement Artist',
      year: 2001,
      providerIds: { audius: `replacement-${track.id}` },
      previewUrl: 'https://preview.example.test/replacement.mp3',
    })
    this.stateValue.deckAction = `Replaced ${track.title}`
    this.emit()
  }

  proposeDiggerTracks(): void {
    this.deckLibrary.proposeTracks('digger-mobile-1', 'friday-mix', 'Deep-cut dance classics', [
      {
        id: 'digger-track',
        title: 'Reviewed Deep Cut',
        artist: 'Digger Artist',
        year: 1992,
        providerIds: { audius: 'digger-track' },
        previewUrl: 'https://preview.example.test/digger.mp3',
      },
    ])
    this.stateValue.deckAction = 'Digger suggestion awaiting review'
    this.emit()
  }

  reviewDiggerTracks(accept: boolean): void {
    this.deckLibrary.reviewProposal('digger-mobile-1', 'host-1', accept)
    this.stateValue.deckAction = accept
      ? 'Digger suggestion accepted'
      : 'Digger suggestion rejected'
    this.emit()
  }

  publishDeck(at: string): void {
    this.deckLibrary.submit('friday-mix')
    this.deckLibrary.approve('friday-mix')
    this.deckLibrary.publish('friday-mix', at)
    this.emit()
  }

  rateDeck(rating: number): void {
    this.deckLibrary.rate('friday-mix', 'guest-1', rating)
    this.deckLibrary.setFeatured('friday-mix', true)
    this.emit()
  }

  exportDeck(format: 'json' | 'csv'): string {
    const value = this.deckLibrary.exportData('friday-mix', format)
    this.stateValue.deckExport = `${format.toUpperCase()} · ${value.length} bytes`
    this.emit()
    return value
  }

  archiveDeck(): void {
    this.deckLibrary.archive('friday-mix')
    this.emit()
  }

  deckCatalog() {
    return this.deckLibrary.discover({ sort: 'rating' })
  }

  deckHealth() {
    return this.deckLibrary.health('friday-mix')
  }

  providerCapabilities(): PlaybackCapabilities[] {
    return this.playback.capabilities
  }

  connectSpotify(): void {
    this.playback.setAuthorization('spotify', true)
    this.syncPlaybackCapabilities()
    this.stateValue.notice = 'Spotify playback connected'
    this.emit()
  }

  disconnectSpotify(): void {
    this.playback.setAuthorization('spotify', false)
    this.syncPlaybackCapabilities()
    this.stateValue.notice = 'Spotify playback disconnected; previews remain available'
    this.emit()
  }

  async completeAccountOAuth(provider: 'apple' | 'google'): Promise<void> {
    await this.account.completeOAuth(provider, 'demo-code', `hitshot://oauth/${provider}`)
    this.syncAccount()
    this.guest(this.account.snapshot.user?.displayName ?? 'Account player')
  }

  async restoreAccount(): Promise<void> {
    await this.account.restore()
    this.syncAccount()
  }

  async signOutAccount(): Promise<void> {
    await this.account.logout()
    this.syncAccount()
  }

  async resolveDemoPlayback(): Promise<void> {
    const resolved = await this.playback.resolve({
      id: 'demo-track',
      title: 'Demo track',
      artist: 'Demo artist',
      year: 1984,
      providerIds: { spotify: 'spotify-demo', audius: 'audius-demo' },
      previewUrl: 'https://preview.example.test/demo.mp3',
    })
    this.stateValue.playbackSource = resolved ? `${resolved.provider}:${resolved.kind}` : null
    this.emit()
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
    if (!this.session.snapshot.members.some((member) => member.id === 'guest-1')) {
      this.session.join({
        id: 'guest-1',
        displayName: name,
        role: 'participant',
        seat: 1,
        connected: true,
      })
    }
    this.event({ kind: 'joined', id: 'guest-1', name })
    this.assignTeam('guest-1', 'team-1')
    this.stateValue.phase = 'lobby'
    this.appendActivity('join', `${name} joined the party`, 'guest-1')
    this.emit()
  }

  applyPreset(preset: PartyPreset): void {
    const presets: Record<PartyPreset, Omit<PartyMatchSettings, 'preset'>> = {
      classic: {
        targetCards: 10,
        namingRequired: false,
        challenges: true,
        steals: false,
        soloTeams: false,
        tokenCap: 5,
        freeCardCost: 3,
      },
      pro: {
        targetCards: 12,
        namingRequired: true,
        challenges: true,
        steals: false,
        soloTeams: false,
        tokenCap: 5,
        freeCardCost: 3,
      },
      expert: {
        targetCards: 15,
        namingRequired: true,
        challenges: true,
        steals: true,
        soloTeams: false,
        tokenCap: 4,
        freeCardCost: 4,
      },
      cutthroat: {
        targetCards: 8,
        namingRequired: true,
        challenges: true,
        steals: true,
        soloTeams: true,
        tokenCap: 3,
        freeCardCost: 3,
      },
    }
    this.stateValue.settings = { preset, ...presets[preset] }
    this.stateValue.tokens = Math.min(this.stateValue.tokens, this.stateValue.settings.tokenCap)
    this.emit()
  }

  configure(patch: Partial<Omit<PartyMatchSettings, 'preset'>>): void {
    const next = { ...this.stateValue.settings, ...patch, preset: 'custom' as const }
    if (!Number.isInteger(next.targetCards) || next.targetCards < 3 || next.targetCards > 50) {
      throw new Error('Target cards must be between 3 and 50')
    }
    if (
      !Number.isInteger(next.tokenCap) ||
      next.tokenCap < 0 ||
      !Number.isInteger(next.freeCardCost) ||
      next.freeCardCost < 1
    ) {
      throw new Error('Token rules are invalid')
    }
    this.stateValue.settings = next
    this.stateValue.tokens = Math.min(this.stateValue.tokens, next.tokenCap)
    this.emit()
  }

  assignTeam(playerId: string, teamId: string): void {
    if (!this.stateValue.teams.some((team) => team.id === teamId)) {
      throw new Error(`Unknown team: ${teamId}`)
    }
    this.stateValue.players = this.stateValue.players.map((player) =>
      player.id === playerId ? { ...player, teamId } : player,
    )
    this.emit()
  }

  claimSeat(playerId: string, seat: number): void {
    this.session.claimSeat(playerId, seat)
    this.stateValue.notice = `${playerId} claimed seat ${seat + 1}`
    this.emit()
  }

  handoffSeat(fromId: string, toId: string): void {
    this.session.handoffSeat(fromId, toId)
    this.stateValue.notice = `Seat handed from ${fromId} to ${toId}`
    this.emit()
  }

  rejoin(playerId: string): void {
    this.session.setConnected(playerId, true)
    this.stateValue.connection = 'online'
    this.stateValue.notice = `${playerId} rejoined the party`
    this.emit()
  }

  seatProjection() {
    return this.session.publicProjection().members
  }

  renameTeam(teamId: string, name: string): void {
    if (!name.trim()) throw new Error('Team name is required')
    this.stateValue.teams = this.stateValue.teams.map((team) =>
      team.id === teamId ? { ...team, name: name.trim() } : team,
    )
    this.emit()
  }

  canStart(): boolean {
    return (
      this.stateValue.players.length > 0 &&
      this.stateValue.players.every(
        (player) => player.ready && (this.stateValue.settings.soloTeams || player.teamId),
      )
    )
  }

  leave(playerId: string, confirmed: boolean): boolean {
    if (!confirmed) return false
    this.stateValue.players = this.stateValue.players.filter((player) => player.id !== playerId)
    if (playerId === 'guest-1') this.stateValue.phase = 'entry'
    this.emit()
    return true
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
    if (!this.canStart()) {
      this.stateValue.notice = 'Every player must choose a team and be ready.'
      this.emit()
      return
    }
    this.event({ kind: 'round', question: 'Name this song', answer: 'Private answer' })
    this.stateValue.activeCard = {
      id: `card-${this.stateValue.round}`,
      year: 1984,
      title: 'Private answer',
      artist: 'Private artist',
    }
    this.stateValue.revealed = false
    this.stateValue.challenge = null
    this.appendActivity(
      'round-start',
      `Round ${this.stateValue.round} started`,
      this.stateValue.hostId,
    )
    this.emit()
  }

  answer(points: number): void {
    if (this.answeredRounds.has(this.stateValue.round)) return
    this.answeredRounds.add(this.stateValue.round)
    this.event({ kind: 'score', points })
    this.event({ kind: 'results' })
    this.appendActivity('round-result', `${points} points awarded`, 'guest-1')
  }

  rematch(): void {
    this.stateValue.phase = 'lobby'
    this.stateValue.winner = false
    this.stateValue.activeCard = null
    this.stateValue.revealed = false
    this.stateValue.ended = false
    this.stateValue.endConfirmationPending = false
    this.emit()
  }

  toggleMute(): void {
    this.stateValue.muted = !this.stateValue.muted
    this.appendActivity(
      'audio',
      this.stateValue.muted ? 'Shared playback muted' : 'Shared playback unmuted',
      'host-1',
    )
    this.emit()
  }

  pauseMatch(): void {
    this.session.pause(this.session.snapshot.hostId ?? 'host-1')
    this.stateValue.paused = true
    this.appendActivity('pause', 'Match paused', this.session.snapshot.hostId ?? 'host-1')
    this.emit()
  }

  resumeMatch(): void {
    this.session.resume(this.session.snapshot.hostId ?? 'host-1')
    this.stateValue.paused = false
    this.appendActivity('resume', 'Match resumed', this.session.snapshot.hostId ?? 'host-1')
    this.emit()
  }

  adjustTokens(delta: number): void {
    this.stateValue.tokens = Math.max(
      0,
      Math.min(this.stateValue.settings.tokenCap, this.stateValue.tokens + delta),
    )
    this.appendActivity('token-adjust', `Tokens adjusted by ${delta}`, 'host-1')
    this.emit()
  }

  requestEndMatch(): void {
    this.stateValue.endConfirmationPending = true
    this.emit()
  }

  cancelEndMatch(): void {
    this.stateValue.endConfirmationPending = false
    this.emit()
  }

  confirmEndMatch(): void {
    if (!this.stateValue.endConfirmationPending) throw new Error('End confirmation is required')
    this.stateValue.ended = true
    this.stateValue.endConfirmationPending = false
    this.stateValue.phase = 'results'
    this.appendActivity('match-end', 'The host ended the match', 'host-1')
    this.emit()
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
    return {
      title: 'Hitshot results',
      message: `Hitshot finished with ${this.stateValue.score} points after ${this.stateValue.round} rounds.`,
    }
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
      this.stateValue.winner =
        this.stateValue.timeline.length >= this.stateValue.settings.targetCards
    }
    this.emit()
    return correct
  }

  judgeNaming(correct: boolean): void {
    if (!this.stateValue.activeCard) return
    this.stateValue.tokens = Math.min(
      this.stateValue.settings.tokenCap,
      this.stateValue.tokens + (correct ? 1 : 0),
    )
    this.emit()
  }

  spendTokensForCard(): boolean {
    const card = this.stateValue.activeCard
    const cost = this.stateValue.settings.freeCardCost
    if (!card || this.stateValue.tokens < cost || this.stateValue.revealed) return false
    this.stateValue.tokens -= cost
    const index = insertionIndex(this.stateValue.timeline, card.year)
    this.stateValue.timeline = [
      ...this.stateValue.timeline.slice(0, index),
      { id: card.id, year: card.year, title: card.title },
      ...this.stateValue.timeline.slice(index),
    ]
    this.stateValue.score += 1
    this.stateValue.revealed = true
    this.stateValue.winner = this.stateValue.timeline.length >= this.stateValue.settings.targetCards
    this.emit()
    return true
  }

  challengePlacement(challengerId: string, index: number): void {
    if (
      !this.stateValue.settings.challenges ||
      !this.stateValue.activeCard ||
      this.stateValue.revealed
    )
      return
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
    this.session.setConnected('host-1', false)
    const recovered = this.session.recoverHost()
    this.stateValue.hostId = recovered
    this.appendActivity('host-recovery', 'Host control recovered', recovered)
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

  async openDeck(): Promise<void> {
    try {
      await this.deck.initialize()
      this.stateValue.phase = 'deck'
      this.stateValue.notice = null
    } catch (error) {
      this.stateValue.notice = `Deck unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`
    }
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

  private syncPlaybackCapabilities(): void {
    this.stateValue.playbackCapabilities = this.playback.capabilities
  }

  private syncAccount(): void {
    this.stateValue.accountStatus =
      this.account.snapshot.status === 'authenticated' ? 'authenticated' : 'anonymous'
    this.stateValue.accountEmail = this.account.snapshot.user?.email ?? null
    this.emit()
  }

  private appendActivity(kind: string, text: string, actorId: string): void {
    const sequence = this.activity.snapshot.lastSequence + 1
    this.activity.append({
      id: `hitshot-activity-${sequence}`,
      sequence,
      kind,
      actorId,
      text,
      createdAt: Date.now(),
    })
    this.stateValue.activityCount = this.activity.snapshot.events.length
  }
}

function createDemoProvider(
  provider: 'spotify' | 'audius',
  authorized: boolean,
  kind: 'full' | 'preview',
): PlaybackProvider {
  return {
    capabilities: {
      provider,
      canSearch: true,
      canPlayFullTrack: kind === 'full',
      canPlayPreview: true,
      requiresAuthorization: provider === 'spotify',
      isAuthorized: authorized,
    },
    search: async (query) => [
      {
        id: `${provider}-${query.toLocaleLowerCase().replace(/\s+/g, '-')}`,
        title: query,
        artist: 'Demo artist',
        year: 1984,
        providerIds: { [provider]: `${provider}-result` },
        previewUrl: 'https://preview.example.test/search.mp3',
      },
    ],
    resolve: async (track) => {
      const providerId = track.providerIds[provider]
      if (!providerId) return null
      return { uri: `${provider}://${providerId}`, kind }
    },
  }
}

function createDemoPartyAccount(): AccountAuthController {
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
      id: 'hitshot-user',
      email: 'player@example.com',
      emailVerified: true,
      displayName: 'Account player',
    },
    accessToken: 'hitshot-access-token',
    refreshToken: 'hitshot-refresh-token',
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

function reduceParty(state: PartyState, event: Event): PartyState {
  if (event.kind === 'joined') {
    return {
      ...state,
      players: [...state.players, { id: event.id, name: event.name, ready: false, teamId: null }],
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
