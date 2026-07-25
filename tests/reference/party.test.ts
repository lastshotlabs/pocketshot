import { describe, expect, it } from 'vitest'
import { PartyDemoController } from '../../examples/party/lib/party'

describe('Party clean-room acceptance model', () => {
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

  it('hands playback/session ownership to a player after host disconnect', async () => {
    const party = new PartyDemoController()
    party.guest('Alex')
    party.hostDisconnect()
    expect(party.state.hostId).toBe('guest-1')
    expect(party.state.connection).toBe('reconnecting')
    await Promise.resolve()
    expect(party.state.connection).toBe('online')
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
})
