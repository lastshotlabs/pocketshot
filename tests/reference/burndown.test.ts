import { describe, expect, it } from 'vitest'
import { BurndownController } from '../../examples/burndown/lib/burndown'

describe('Burndown native acceptance model', () => {
  it('plays a separate-phone turn, challenge, elimination, and rematch', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.start()
    expect(game.state.phase).toBe('turn')
    expect(game.burn('Answer', 'burn-1')).toBe(true)
    game.openChallenge()
    game.vote('p1', 'invalid')
    game.vote('p2', 'invalid')
    expect(game.resolveChallenge()).toBe('invalid')
    for (let index = 0; index < 5 && game.state.phase !== 'results'; index += 1) game.timeout()
    expect(game.state.phase).toBe('results')
    expect(game.rematch('again')).toBe(true)
    expect(game.rematch('again')).toBe(false)
    expect(game.state.phase).toBe('lobby')
  })

  it('enforces pass-the-phone privacy and command idempotency', () => {
    const game = new BurndownController()
    game.enter('shared')
    game.start()
    expect(game.state.phase).toBe('handoff')
    expect(game.sharedState).toMatchObject({ curtainVisible: true, wakeLock: true })
    game.revealHandoff()
    expect(game.state.phase).toBe('turn')
    expect(game.burn('Answer', 'same-command')).toBe(true)
    expect(game.state.phase).toBe('handoff')
  })

  it('projects only public match state and recovers host control', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.start()
    expect(game.projection()).not.toHaveProperty('notice')
    expect(game.recoverHost()).toBe('p2')
    expect(game.state.notice).toContain('recovered')
  })
})
