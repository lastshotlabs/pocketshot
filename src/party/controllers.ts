export type DeckStatus = 'draft' | 'submitted' | 'approved' | 'published' | 'archived'

export interface PartyTrack {
  id: string
  title: string
  artist: string
  year: number | null
  providerIds: Partial<Record<'spotify' | 'audius', string>>
  previewUrl: string | null
}

export interface PartyDeck {
  id: string
  title: string
  status: DeckStatus
  tracks: PartyTrack[]
  revision: number
  publishedAt: string | null
}

export interface DeckHealth {
  playable: number
  missingYear: number
  duplicates: string[]
  isPublishable: boolean
}

export class DeckLibraryController {
  private decks = new Map<string, PartyDeck>()

  get snapshot(): PartyDeck[] {
    return [...this.decks.values()].map((deck) => structuredClone(deck))
  }

  create(id: string, title: string): void {
    if (!title.trim()) throw new Error('Deck title is required')
    if (this.decks.has(id)) throw new Error(`Deck already exists: ${id}`)
    this.decks.set(id, {
      id,
      title: title.trim(),
      status: 'draft',
      tracks: [],
      revision: 1,
      publishedAt: null,
    })
  }

  import(id: string, tracks: PartyTrack[], mode: 'replace' | 'append' = 'append'): void {
    const deck = this.requireEditable(id)
    if (mode === 'replace') deck.tracks = []
    for (const track of tracks) this.add(id, track)
  }

  importDelimited(id: string, input: string): void {
    this.import(id, parseDelimitedTracks(input))
  }

  combine(targetId: string, sourceIds: string[]): void {
    this.import(
      targetId,
      sourceIds.flatMap((sourceId) => this.require(sourceId).tracks),
    )
  }

  add(id: string, track: PartyTrack): void {
    const deck = this.requireEditable(id)
    validateTrack(track)
    const key = trackIdentity(track)
    if (!deck.tracks.some((candidate) => trackIdentity(candidate) === key)) {
      deck.tracks.push(structuredClone(track))
      deck.revision += 1
    }
  }

  replace(id: string, trackId: string, replacement: PartyTrack): void {
    const deck = this.requireEditable(id)
    validateTrack(replacement)
    const index = deck.tracks.findIndex((track) => track.id === trackId)
    if (index < 0) throw new Error(`Unknown track: ${trackId}`)
    deck.tracks[index] = structuredClone(replacement)
    deck.revision += 1
  }

  remove(id: string, trackId: string): void {
    const deck = this.requireEditable(id)
    deck.tracks = deck.tracks.filter((track) => track.id !== trackId)
    deck.revision += 1
  }

  health(id: string): DeckHealth {
    const deck = this.require(id)
    const identities = deck.tracks.map(trackIdentity)
    const duplicates = [
      ...new Set(identities.filter((key, index) => identities.indexOf(key) !== index)),
    ]
    const playable = deck.tracks.filter(
      (track) => track.previewUrl || Object.keys(track.providerIds).length,
    ).length
    const missingYear = deck.tracks.filter((track) => track.year === null).length
    return {
      playable,
      missingYear,
      duplicates,
      isPublishable:
        deck.tracks.length > 0 &&
        playable === deck.tracks.length &&
        missingYear === 0 &&
        duplicates.length === 0,
    }
  }

  submit(id: string): void {
    const deck = this.requireEditable(id)
    if (!this.health(id).isPublishable) {
      throw new Error('Deck health checks must pass before submission')
    }
    deck.status = 'submitted'
  }

  approve(id: string): void {
    const deck = this.require(id)
    if (deck.status !== 'submitted') throw new Error('Only submitted decks can be approved')
    deck.status = 'approved'
  }

  publish(id: string, at: string): void {
    const deck = this.require(id)
    if (deck.status !== 'approved') throw new Error('Only approved decks can be published')
    deck.status = 'published'
    deck.publishedAt = at
  }

  archive(id: string): void {
    this.require(id).status = 'archived'
  }

  private require(id: string): PartyDeck {
    const deck = this.decks.get(id)
    if (!deck) throw new Error(`Unknown deck: ${id}`)
    return deck
  }

  private requireEditable(id: string): PartyDeck {
    const deck = this.require(id)
    if (deck.status !== 'draft') throw new Error('Only draft decks can be edited')
    return deck
  }
}

export interface PlaybackCapabilities {
  provider: string
  canSearch: boolean
  canPlayFullTrack: boolean
  canPlayPreview: boolean
  requiresAuthorization: boolean
  isAuthorized: boolean
}

export interface PlaybackProvider {
  readonly capabilities: PlaybackCapabilities
  search(query: string): Promise<PartyTrack[]>
  resolve(track: PartyTrack): Promise<{ uri: string; kind: 'full' | 'preview' } | null>
}

export class PlaybackProviderController {
  private providers = new Map<string, PlaybackProvider>()

  constructor(providers: PlaybackProvider[]) {
    for (const provider of providers) this.providers.set(provider.capabilities.provider, provider)
  }

  get capabilities(): PlaybackCapabilities[] {
    return [...this.providers.values()].map((provider) => structuredClone(provider.capabilities))
  }

  async search(query: string): Promise<PartyTrack[]> {
    const results = await Promise.all(
      [...this.providers.values()]
        .filter((provider) => provider.capabilities.canSearch && this.isAvailable(provider))
        .map((provider) => provider.search(query)),
    )
    const found = new Map<string, PartyTrack>()
    for (const track of results.flat()) found.set(trackIdentity(track), track)
    return [...found.values()]
  }

  async resolve(
    track: PartyTrack,
    preferred?: string,
  ): Promise<{ provider: string; uri: string; kind: 'full' | 'preview' } | null> {
    const ordered = [...this.providers.values()].sort((provider) => {
      if (provider.capabilities.provider === preferred) return -1
      return provider.capabilities.canPlayFullTrack ? -1 : 1
    })
    for (const provider of ordered) {
      if (!this.isAvailable(provider)) continue
      const source = await provider.resolve(track)
      if (source) return { provider: provider.capabilities.provider, ...source }
    }
    return track.previewUrl ? { provider: 'preview', uri: track.previewUrl, kind: 'preview' } : null
  }

  private isAvailable(provider: PlaybackProvider): boolean {
    const capabilities = provider.capabilities
    return !capabilities.requiresAuthorization || capabilities.isAuthorized
  }
}

export interface PartyReplayEvent {
  at: string
  kind: string
  actorId: string | null
  public: Record<string, unknown>
  private?: Record<string, unknown>
}

export function exportPartyReplay(
  matchId: string,
  events: PartyReplayEvent[],
  audience: 'participant' | 'support',
): string {
  return JSON.stringify({
    schemaVersion: 1,
    matchId,
    events: events.map(({ private: privateFields, ...event }) => ({
      ...event,
      ...(audience === 'support' && privateFields ? { private: redactSecrets(privateFields) } : {}),
    })),
  })
}

function validateTrack(track: PartyTrack): void {
  if (!track.id || !track.title.trim() || !track.artist.trim()) {
    throw new Error('Track id, title, and artist are required')
  }
  if (
    track.year !== null &&
    (!Number.isInteger(track.year) || track.year < 1000 || track.year > 9999)
  ) {
    throw new Error('Track year must be a four-digit year')
  }
}

function trackIdentity(track: PartyTrack): string {
  return `${track.title.trim().toLocaleLowerCase()}::${track.artist.trim().toLocaleLowerCase()}`
}

function parseDelimitedTracks(input: string): PartyTrack[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title = '', artist = '', year = '', previewUrl = ''] = line
        .split(/\t|,/)
        .map((value) => value.trim())
      const track: PartyTrack = {
        id: `import-${index + 1}`,
        title,
        artist,
        year: year ? Number(year) : null,
        providerIds: {},
        previewUrl: previewUrl || null,
      }
      validateTrack(track)
      return track
    })
}

function redactSecrets(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /answer|token|secret|email/i.test(key) ? '[REDACTED]' : item,
    ]),
  )
}
