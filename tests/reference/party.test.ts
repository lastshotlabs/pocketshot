import { describe, expect, it } from 'vitest'
import { PartyDemoController } from '../../examples/party/lib/party'
import { normalizePartySystemPath } from '../../examples/party/lib/party-link'

describe('Party clean-room acceptance model', () => {
  it('composes durable account OAuth separately from playback-provider authorization', async () => {
    const party = new PartyDemoController()
    await party.completeAccountOAuth('apple')
    expect(party.state).toMatchObject({
      phase: 'lobby',
      accountStatus: 'authenticated',
      accountEmail: 'player@example.com',
      players: [expect.objectContaining({ name: 'Account player' })],
    })
    expect(
      party.state.playbackCapabilities.find((provider) => provider.provider === 'spotify'),
    ).toMatchObject({ isAuthorized: false })
    await party.signOutAccount()
    expect(party.state.accountStatus).toBe('anonymous')
  })

  it('completes guest, lobby, realtime round, result, and rematch', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.ready()
    party.startRound()
    party.answer(3)
    expect(party.state).toMatchObject({ phase: 'results', score: 3 })
    party.rematch()
    expect(party.state.phase).toBe('lobby')
  })

  it('configures presets, teams, readiness, and confirmed leave', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.applyPreset('expert')
    party.assignTeam('guest-1', 'team-2')
    party.renameTeam('team-2', 'Needle Drops')
    expect(party.canStart()).toBe(false)
    party.ready()
    expect(party.canStart()).toBe(true)
    expect(party.state).toMatchObject({
      settings: {
        preset: 'expert',
        targetCards: 15,
        namingRequired: true,
        steals: true,
      },
      teams: [expect.anything(), expect.objectContaining({ name: 'Needle Drops' })],
    })
    expect(party.leave('guest-1', false)).toBe(false)
    expect(party.leave('guest-1', true)).toBe(true)
    expect(party.state.phase).toBe('entry')
  })

  it('validates custom match and token rules', () => {
    const party = new PartyDemoController()
    expect(() => party.configure({ targetCards: 2 })).toThrow('between')
    party.configure({ targetCards: 20, tokenCap: 2, freeCardCost: 2 })
    expect(party.state.settings).toMatchObject({
      preset: 'custom',
      targetCards: 20,
      tokenCap: 2,
      freeCardCost: 2,
    })
  })

  it('deduplicates a rapid repeated player action', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    party.answer(3)
    party.answer(3)
    expect(party.state.score).toBe(3)
  })

  it('rejects stale join codes without destructive navigation', () => {
    const party = new PartyDemoController()
    party.join('OLD-000', 'Alex')
    expect(party.state).toMatchObject({
      phase: 'entry',
      notice: 'That join code has expired.',
    })
  })

  it('joins from cold/warm deep-link and QR payloads', () => {
    const party = new PartyDemoController()
    party.joinFromUrl('pocketshot-party://join/HIT-427')
    expect(party.state).toMatchObject({
      phase: 'lobby',
      players: [expect.objectContaining({ name: 'Linked guest' })],
    })
  })

  it('routes Android custom-scheme system URLs into the Expo join screen', () => {
    expect(normalizePartySystemPath('pocketshot-party://join/HIT-427')).toBe('/join/HIT-427')
    expect(normalizePartySystemPath('/games')).toBe('/games')
    expect(normalizePartySystemPath('pocketshot-party://join/%E0%A4%A')).toBe('/')
  })

  it('hands playback/session ownership to a player after host disconnect', async () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.hostDisconnect()
    expect(party.state.hostId).toBe('guest-1')
    expect(party.state.connection).toBe('reconnecting')
    await Promise.resolve()
    expect(party.state.connection).toBe('online')
  })

  it('composes host pause, audio, token, activity, reviewed end, and sharing controls', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    party.toggleMute()
    party.pauseMatch()
    expect(party.state).toMatchObject({ muted: true, paused: true })
    party.resumeMatch()
    party.adjustTokens(99)
    expect(party.state.tokens).toBe(party.state.settings.tokenCap)
    party.reactToLatest('guest-1', '🔥')
    expect(party.activityProjection().at(-1)?.reactions).toEqual({ '🔥': ['guest-1'] })
    expect(() => party.confirmEndMatch()).toThrow('confirmation')
    party.requestEndMatch()
    party.cancelEndMatch()
    party.requestEndMatch()
    party.confirmEndMatch()
    expect(party.state).toMatchObject({ phase: 'results', ended: true })
    expect(party.resultsSharePayload()).toMatchObject({
      title: 'Hitshot results',
      message: expect.stringContaining('Hitshot'),
    })
  })

  it('shows an explicit removed state for a kicked player', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.kickPlayer('guest-1')
    expect(party.state).toMatchObject({
      phase: 'entry',
      notice: 'You were removed from this party.',
    })
  })

  it('never projects the hidden answer to a second screen', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    expect(JSON.stringify(party.publicDisplay())).not.toContain('Private answer')
    expect(JSON.stringify(party.publicDisplay())).not.toContain('Private artist')
  })

  it('accepts relative timeline placement and either side of an equal year', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    expect(party.placeCard(1)).toBe(true)
    expect(party.state.timeline.map((card) => card.year)).toEqual([1972, 1984, 1999])

    party.startRound()
    expect(party.placeCard(1)).toBe(true)
    expect(party.state.timeline.map((card) => card.year)).toEqual([1972, 1984, 1984, 1999])
  })

  it('caps naming tokens and spends three for a correctly ordered free card', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    party.judgeNaming(true)
    party.judgeNaming(true)
    party.judgeNaming(true)
    party.judgeNaming(true)
    expect(party.state.tokens).toBe(5)
    expect(party.spendTokensForCard()).toBe(true)
    expect(party.state.tokens).toBe(2)
    expect(party.state.timeline.map((card) => card.year)).toEqual([1972, 1984, 1999])
  })

  it('awards a challenged card only to the side with a correct placement', () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.startRound()
    party.challengePlacement('team-2', 1)
    expect(party.resolveChallenge(0)).toBe('challenger')
    expect(party.state.timeline.map((card) => card.year)).toEqual([1972, 1984, 1999])
  })

  it('imports, validates, and publishes a healthy deck through the package entry', () => {
    const party = new PartyDemoController()
    let renders = 0
    party.subscribe(() => {
      renders += 1
    })
    party.importTracks('Blue Monday,New Order,1983,https://preview.test/blue-monday')
    expect(party.deckHealth()).toMatchObject({ playable: 1, isPublishable: true })
    expect(renders).toBe(2)
    party.publishDeck('2026-07-25T00:00:00Z')
    expect(party.deckLibrary.snapshot[0].status).toBe('published')
    party.rateDeck(5)
    expect(party.deckCatalog()[0]).toMatchObject({
      featured: true,
      averageRating: 5,
      ratingCount: 1,
    })
    expect(party.exportDeck('json')).toContain('Blue Monday')
    expect(party.exportDeck('csv')).toContain('New Order')
    expect(party.state.deckExport).toMatch(/^CSV/)
  })

  it('composes playlist import, provider search, audition, year correction, and reviewed Digger suggestions', async () => {
    const party = new PartyDemoController()
    await party.importDemoPlaylist()
    await party.searchAndAddTrack('dance')
    await party.auditionFirstTrack()
    party.correctFirstTrackYear(1984)
    party.proposeDiggerTracks()
    expect(party.deckLibrary.proposalSnapshot[0].status).toBe('pending')
    expect(party.deckLibrary.snapshot[0].tracks).toHaveLength(2)
    party.reviewDiggerTracks(true)
    expect(party.deckLibrary.snapshot[0].tracks).toHaveLength(3)
    expect(party.deckLibrary.proposalSnapshot[0]).toMatchObject({
      status: 'accepted',
      reviewedBy: 'host-1',
    })
    expect(party.state).toMatchObject({
      playbackSource: 'audius:preview',
      deckAction: 'Digger suggestion accepted',
    })
  })

  it('combines decks and replaces tracks with version history', () => {
    const party = new PartyDemoController()
    party.importTracks('Blue Monday,New Order,1983,https://preview.test/blue-monday')
    const before = party.deckLibrary.history('friday-mix').length
    party.combineDemoDeck()
    expect(
      party.deckLibrary.snapshot.find((deck) => deck.id === 'friday-mix')?.tracks,
    ).toHaveLength(2)
    party.replaceFirstTrack()
    expect(
      party.deckLibrary.snapshot.find((deck) => deck.id === 'friday-mix')?.tracks[0],
    ).toMatchObject({
      title: 'Replacement Track',
      year: 2001,
    })
    expect(party.deckLibrary.history('friday-mix').length).toBeGreaterThan(before)
    expect(party.state.deckAction).toContain('Replaced')
  })

  it('reports provider capabilities, authorizes Spotify, and falls back to Audius previews', async () => {
    const party = new PartyDemoController()
    expect(party.providerCapabilities()).toEqual([
      expect.objectContaining({
        provider: 'spotify',
        requiresAuthorization: true,
        isAuthorized: false,
      }),
      expect.objectContaining({ provider: 'audius', isAuthorized: true }),
    ])
    await party.resolveDemoPlayback()
    expect(party.state.playbackSource).toBe('audius:preview')
    party.connectSpotify()
    await party.resolveDemoPlayback()
    expect(party.state.playbackSource).toBe('spotify:full')
    party.disconnectSpotify()
    expect(party.state.playbackCapabilities[0].isAuthorized).toBe(false)
  })

  it('initializes durable storage before exposing the deck screen', async () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    await party.openDeck()
    expect(party.state).toMatchObject({ phase: 'deck', notice: null })
    expect(party.deck.snapshot.value.title).toBe('Friday Mix')
  })
})
