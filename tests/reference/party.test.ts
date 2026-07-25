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
  })
})
