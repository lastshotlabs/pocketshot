import {
  DeckLibraryController,
  PlaybackProviderController,
  exportPartyReplay,
  type PartyTrack,
  type PlaybackProvider,
} from '../../src/party'
import { describe, expect, it, vi } from 'vitest'

const track = (id: string, title = `Track ${id}`): PartyTrack => ({
  id,
  title,
  artist: 'Artist',
  year: 1999,
  providerIds: { spotify: id },
  previewUrl: `https://preview.test/${id}`,
})

describe('DeckLibraryController', () => {
  it('bounds deck history and rejects unsafe preview URLs', () => {
    const library = new DeckLibraryController({
      decks: 1,
      tracksPerDeck: 2,
      versionsPerDeck: 2,
      proposals: 1,
      ratingsPerDeck: 1,
    })
    library.create('deck', 'Safe')
    expect(() => library.add('deck', { ...track('1'), previewUrl: 'http://preview.test/1' })).toThrow(
      'HTTPS',
    )
    library.add('deck', track('1'))
    library.add('deck', track('2'))
    expect(library.history('deck')).toHaveLength(2)
    expect(() => library.add('deck', track('3'))).toThrow('capacity')
  })
  it('imports, combines, deduplicates, and reports deck health', () => {
    const library = new DeckLibraryController()
    library.create('one', 'One')
    library.create('two', 'Two')
    library.import('one', [track('1')])
    library.importDelimited('two', 'Track 2,Artist,2001,https://preview.test/2')
    library.combine('one', ['two'])
    library.add('one', track('duplicate', 'Track 1'))
    expect(library.snapshot.find((deck) => deck.id === 'one')?.tracks).toHaveLength(2)
    expect(library.health('one')).toMatchObject({
      playable: 2,
      missingYear: 0,
      isPublishable: true,
    })
  })

  it('supports replacement and the moderated publish lifecycle', () => {
    const library = new DeckLibraryController()
    library.create('deck', 'Friday')
    library.add('deck', track('1'))
    library.replace('deck', '1', track('2'))
    library.submit('deck')
    expect(() => library.add('deck', track('3'))).toThrow('Only draft')
    library.approve('deck')
    library.publish('deck', '2026-07-25T00:00:00Z')
    expect(library.snapshot[0]).toMatchObject({
      status: 'published',
      publishedAt: '2026-07-25T00:00:00Z',
    })
    library.archive('deck')
    expect(library.snapshot[0].status).toBe('archived')
  })

  it('rejects incomplete decks before moderation', () => {
    const library = new DeckLibraryController()
    library.create('deck', 'Friday')
    library.add('deck', { ...track('1'), year: null })
    expect(library.health('deck')).toMatchObject({ missingYear: 1, isPublishable: false })
    expect(() => library.submit('deck')).toThrow('health checks')
  })

  it('supports rated discovery, featured ordering, version history, and JSON/CSV transfer', () => {
    const library = new DeckLibraryController()
    library.create('source', 'Friday Favorites')
    library.add('source', track('1', 'Blue Monday'))
    library.submit('source')
    library.approve('source')
    library.publish('source', '2026-07-25T12:00:00.000Z')
    library.rate('source', 'alex', 5)
    library.rate('source', 'sam', 3)
    library.rate('source', 'alex', 4)
    library.setFeatured('source', true)
    expect(library.discover({ query: 'blue', sort: 'rating' })[0]).toMatchObject({
      featured: true,
      averageRating: 3.5,
      ratingCount: 2,
      deck: { id: 'source', status: 'published' },
    })
    expect(library.history('source').length).toBeGreaterThanOrEqual(5)

    const json = library.exportData('source', 'json')
    const csv = library.exportData('source', 'csv')
    expect(csv).toContain('Blue Monday')
    const target = new DeckLibraryController()
    target.create('target', 'Imported')
    target.importJson('target', json)
    expect(target.snapshot[0].tracks).toEqual([track('1', 'Blue Monday')])
    expect(() => target.importJson('target', '{bad')).toThrow('invalid')
  })

  it('imports provider playlists, corrects years, and requires review before adding AI tracks', async () => {
    const library = new DeckLibraryController()
    library.create('deck', 'Deep Cuts')
    await library.importPlaylist('deck', 'spotify:playlist:one', {
      importPlaylist: async (reference) => {
        expect(reference).toBe('spotify:playlist:one')
        return [{ ...track('playlist'), year: null }]
      },
    })
    library.correctYear('deck', 'playlist', 2003)
    library.proposeTracks('proposal', 'deck', 'Find overlooked tracks', [track('suggested')])
    expect(library.snapshot[0].tracks.map(({ id }) => id)).toEqual(['playlist'])
    expect(library.proposalSnapshot[0]).toMatchObject({
      status: 'pending',
      reviewedBy: null,
    })
    library.reviewProposal('proposal', 'editor', true)
    expect(library.snapshot[0].tracks.map(({ id }) => id)).toEqual(['playlist', 'suggested'])
    expect(library.proposalSnapshot[0]).toMatchObject({
      status: 'accepted',
      reviewedBy: 'editor',
    })
    expect(library.snapshot[0].tracks[0].year).toBe(2003)
    expect(() => library.reviewProposal('proposal', 'editor', false)).toThrow('already')
  })

  it('keeps rejected AI suggestions out of a deck', () => {
    const library = new DeckLibraryController()
    library.create('deck', 'Deep Cuts')
    library.proposeTracks('proposal', 'deck', 'Find tracks', [track('suggested')])
    library.reviewProposal('proposal', 'editor', false)
    expect(library.snapshot[0].tracks).toEqual([])
    expect(library.proposalSnapshot[0].status).toBe('rejected')
  })
})

describe('PlaybackProviderController', () => {
  const provider = (
    name: string,
    authorized: boolean,
    kind: 'full' | 'preview',
  ): PlaybackProvider => ({
    capabilities: {
      provider: name,
      canSearch: true,
      canPlayFullTrack: kind === 'full',
      canPlayPreview: true,
      requiresAuthorization: name === 'spotify',
      isAuthorized: authorized,
    },
    search: vi.fn(async () => [track(name, 'Shared')]),
    resolve: vi.fn(async () => ({ uri: `${name}://track`, kind })),
  })

  it('reports capabilities and skips unauthorized providers', async () => {
    const spotify = provider('spotify', false, 'full')
    const audius = provider('audius', true, 'preview')
    const controller = new PlaybackProviderController([spotify, audius])
    expect(controller.capabilities).toHaveLength(2)
    expect(await controller.search('shared')).toHaveLength(1)
    expect(spotify.search).not.toHaveBeenCalled()
    expect(await controller.resolve(track('1'), 'spotify')).toMatchObject({
      provider: 'audius',
      kind: 'preview',
    })
    controller.setAuthorization('spotify', true)
    expect(controller.capabilities.find((item) => item.provider === 'spotify')?.isAuthorized).toBe(
      true,
    )
    expect(await controller.search('shared')).toHaveLength(1)
    expect(spotify.search).toHaveBeenCalledOnce()
    controller.setAuthorization('spotify', false)
    expect(controller.capabilities.find((item) => item.provider === 'spotify')?.isAuthorized).toBe(
      false,
    )
  })

  it('uses a plain preview when every provider is unavailable', async () => {
    const controller = new PlaybackProviderController([provider('spotify', false, 'full')])
    expect(await controller.resolve(track('1'))).toEqual({
      provider: 'preview',
      uri: 'https://preview.test/1',
      kind: 'preview',
    })
  })
})

describe('exportPartyReplay', () => {
  it('omits private fields for participants and redacts secrets for support', () => {
    const events = [
      {
        at: 'now',
        kind: 'answer',
        actorId: 'p1',
        public: { score: 1 },
        private: { answer: '1984', trace: 'ok' },
      },
    ]
    expect(exportPartyReplay('match', events, 'participant')).not.toContain('1984')
    const support = exportPartyReplay('match', events, 'support')
    expect(support).toContain('[REDACTED]')
    expect(support).toContain('trace')
  })
})
