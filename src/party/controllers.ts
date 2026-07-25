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

export interface PartyDeckCatalogEntry {
  deck: PartyDeck
  featured: boolean
  averageRating: number | null
  ratingCount: number
}

export interface DeckTrackProposal {
  id: string
  deckId: string
  prompt: string
  tracks: PartyTrack[]
  status: 'pending' | 'accepted' | 'rejected'
  reviewedBy: string | null
}

export interface PlaylistImporter {
  importPlaylist(reference: string): Promise<PartyTrack[]>
}

export class DeckLibraryController {
  private decks = new Map<string, PartyDeck>()
  private versions = new Map<string, PartyDeck[]>()
  private ratings = new Map<string, Map<string, number>>()
  private featured = new Set<string>()
  private proposals = new Map<string, DeckTrackProposal>()

  get snapshot(): PartyDeck[] {
    return [...this.decks.values()].map((deck) => structuredClone(deck))
  }

  get proposalSnapshot(): DeckTrackProposal[] {
    return [...this.proposals.values()].map((proposal) => structuredClone(proposal))
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
    this.recordVersion(id)
  }

  import(id: string, tracks: PartyTrack[], mode: 'replace' | 'append' = 'append'): void {
    const deck = this.requireEditable(id)
    if (mode === 'replace') deck.tracks = []
    for (const track of tracks) this.add(id, track)
  }

  importDelimited(id: string, input: string): void {
    this.import(id, parseDelimitedTracks(input))
  }

  async importPlaylist(id: string, reference: string, importer: PlaylistImporter): Promise<void> {
    if (!reference.trim()) throw new Error('Playlist reference is required')
    const tracks = await importer.importPlaylist(reference.trim())
    this.import(id, tracks)
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
      this.recordVersion(id)
    }
  }

  replace(id: string, trackId: string, replacement: PartyTrack): void {
    const deck = this.requireEditable(id)
    validateTrack(replacement)
    const index = deck.tracks.findIndex((track) => track.id === trackId)
    if (index < 0) throw new Error(`Unknown track: ${trackId}`)
    deck.tracks[index] = structuredClone(replacement)
    deck.revision += 1
    this.recordVersion(id)
  }

  correctYear(id: string, trackId: string, year: number): void {
    const deck = this.requireEditable(id)
    const track = deck.tracks.find((candidate) => candidate.id === trackId)
    if (!track) throw new Error(`Unknown track: ${trackId}`)
    this.replace(id, trackId, { ...track, year })
  }

  proposeTracks(id: string, deckId: string, prompt: string, tracks: PartyTrack[]): void {
    this.requireEditable(deckId)
    if (this.proposals.has(id)) throw new Error(`Proposal already exists: ${id}`)
    if (!prompt.trim() || tracks.length === 0) {
      throw new Error('A proposal requires a prompt and at least one track')
    }
    tracks.forEach(validateTrack)
    this.proposals.set(id, {
      id,
      deckId,
      prompt: prompt.trim(),
      tracks: structuredClone(tracks),
      status: 'pending',
      reviewedBy: null,
    })
  }

  reviewProposal(id: string, reviewerId: string, accept: boolean): void {
    const proposal = this.proposals.get(id)
    if (!proposal) throw new Error(`Unknown proposal: ${id}`)
    if (proposal.status !== 'pending') throw new Error('Proposal has already been reviewed')
    if (!reviewerId.trim()) throw new Error('Reviewer is required')
    if (accept) this.import(proposal.deckId, proposal.tracks)
    proposal.status = accept ? 'accepted' : 'rejected'
    proposal.reviewedBy = reviewerId
  }

  remove(id: string, trackId: string): void {
    const deck = this.requireEditable(id)
    deck.tracks = deck.tracks.filter((track) => track.id !== trackId)
    deck.revision += 1
    this.recordVersion(id)
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
    this.recordVersion(id)
  }

  approve(id: string): void {
    const deck = this.require(id)
    if (deck.status !== 'submitted') throw new Error('Only submitted decks can be approved')
    deck.status = 'approved'
    this.recordVersion(id)
  }

  publish(id: string, at: string): void {
    const deck = this.require(id)
    if (deck.status !== 'approved') throw new Error('Only approved decks can be published')
    deck.status = 'published'
    deck.publishedAt = at
    this.recordVersion(id)
  }

  archive(id: string): void {
    this.require(id).status = 'archived'
    this.recordVersion(id)
  }

  rate(id: string, userId: string, rating: number): void {
    const deck = this.require(id)
    if (deck.status !== 'published') throw new Error('Only published decks can be rated')
    if (!userId.trim() || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Deck ratings require a user and an integer from 1 to 5')
    }
    const ratings = this.ratings.get(id) ?? new Map<string, number>()
    ratings.set(userId, rating)
    this.ratings.set(id, ratings)
  }

  setFeatured(id: string, featured: boolean): void {
    this.require(id)
    if (featured) this.featured.add(id)
    else this.featured.delete(id)
  }

  discover(
    input: {
      query?: string
      status?: DeckStatus
      sort?: 'rating' | 'title' | 'updated'
    } = {},
  ): PartyDeckCatalogEntry[] {
    const query = input.query?.trim().toLocaleLowerCase() ?? ''
    const entries = this.snapshot
      .filter(
        (deck) =>
          (!query ||
            deck.title.toLocaleLowerCase().includes(query) ||
            deck.tracks.some(
              (track) =>
                track.title.toLocaleLowerCase().includes(query) ||
                track.artist.toLocaleLowerCase().includes(query),
            )) &&
          (!input.status || deck.status === input.status),
      )
      .map((deck) => this.catalogEntry(deck))
    return entries.sort((left, right) => {
      if (left.featured !== right.featured) return left.featured ? -1 : 1
      if (input.sort === 'rating') {
        return (right.averageRating ?? -1) - (left.averageRating ?? -1)
      }
      if (input.sort === 'title') return left.deck.title.localeCompare(right.deck.title)
      return (
        right.deck.revision - left.deck.revision || left.deck.title.localeCompare(right.deck.title)
      )
    })
  }

  history(id: string): PartyDeck[] {
    this.require(id)
    return structuredClone(this.versions.get(id) ?? [])
  }

  exportData(id: string, format: 'json' | 'csv'): string {
    const deck = this.require(id)
    if (format === 'json') return JSON.stringify(deck, null, 2)
    return [
      'title,artist,year,previewUrl,spotifyId,audiusId',
      ...deck.tracks.map((track) =>
        [
          track.title,
          track.artist,
          track.year ?? '',
          track.previewUrl ?? '',
          track.providerIds.spotify ?? '',
          track.providerIds.audius ?? '',
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\n')
  }

  importJson(targetId: string, input: string, mode: 'replace' | 'append' = 'append'): void {
    let value: unknown
    try {
      value = JSON.parse(input)
    } catch {
      throw new Error('Deck JSON is invalid')
    }
    if (!isPartyDeckTransfer(value)) throw new Error('Deck JSON has an invalid shape')
    this.import(targetId, value.tracks, mode)
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

  private recordVersion(id: string): void {
    const deck = this.decks.get(id)
    if (!deck) return
    const versions = this.versions.get(id) ?? []
    versions.push(structuredClone(deck))
    this.versions.set(id, versions)
  }

  private catalogEntry(deck: PartyDeck): PartyDeckCatalogEntry {
    const values = [...(this.ratings.get(deck.id)?.values() ?? [])]
    return {
      deck,
      featured: this.featured.has(deck.id),
      averageRating: values.length
        ? values.reduce((total, value) => total + value, 0) / values.length
        : null,
      ratingCount: values.length,
    }
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

  setAuthorization(providerId: string, authorized: boolean): void {
    const provider = this.providers.get(providerId)
    if (!provider) throw new Error(`Unknown playback provider: ${providerId}`)
    if (!provider.capabilities.requiresAuthorization && !authorized) {
      throw new Error(`${providerId} does not require authorization`)
    }
    provider.capabilities.isAuthorized = authorized
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

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function isPartyDeckTransfer(value: unknown): value is Pick<PartyDeck, 'tracks'> {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { tracks?: unknown }).tracks)
  ) {
    return false
  }
  return (value as { tracks: unknown[] }).tracks.every((track) => {
    if (!track || typeof track !== 'object') return false
    const candidate = track as Partial<PartyTrack>
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      typeof candidate.artist === 'string' &&
      (candidate.year === null || typeof candidate.year === 'number') &&
      !!candidate.providerIds &&
      typeof candidate.providerIds === 'object' &&
      (candidate.previewUrl === null || typeof candidate.previewUrl === 'string')
    )
  })
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
