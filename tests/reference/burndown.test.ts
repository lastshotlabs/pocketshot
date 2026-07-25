import { describe, expect, it } from 'vitest'
import { BurndownController } from '../../examples/burndown/lib/burndown'
import { normalizeBurndownSystemPath } from '../../examples/burndown/lib/link'

describe('Burndown native acceptance model', () => {
  it('normalizes cold native joins and rejects expired invites', () => {
    expect(normalizeBurndownSystemPath('pocketshot-burndown://join/BURN-42')).toBe('/join/BURN-42')
    expect(normalizeBurndownSystemPath('pocketshot-burndown://join/%E0%A4%A')).toBe('/')
    const game = new BurndownController()
    expect(game.join('expired')).toBe(false)
    expect(game.join('burn-42')).toBe(true)
    expect(game.state.phase).toBe('lobby')
  })

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

  it('reviews, searches, validates, and publishes category decks', () => {
    const game = new BurndownController()
    game.proposeCategories('ai-1', ['Things in space'], 'Adds a broad category')
    game.reviewCategoryProposal('ai-1', true)
    expect(game.categories.browse({ query: 'space' }).items).toHaveLength(1)
    game.publishCategories()
    expect(game.categories.snapshot[0]).toMatchObject({
      status: 'published',
      items: expect.arrayContaining([{ category: 'Things in space' }]),
    })
  })

  it('supports staged host rules, life correction, and explicit match termination', () => {
    const game = new BurndownController()
    game.stageRules({ lives: 5, turnMs: 15_000 })
    game.adjustLives('p2', -1)
    expect(game.state.players.find((player) => player.id === 'p2')?.lives).toBe(2)
    game.endMatch()
    expect(game.state).toMatchObject({ phase: 'results', ended: true })
    game.rematch('staged')
    expect(game.rules).toMatchObject({ lives: 5, turnMs: 15_000 })
  })

  it('restores shared-device privacy and deduplication after process death', () => {
    const game = new BurndownController()
    game.enter('shared')
    game.start()
    game.revealHandoff()
    game.burn('Answer', 'persisted-command')
    const restored = new BurndownController(game.exportSnapshot())
    expect(restored.state.phase).toBe('handoff')
    expect(restored.sharedState).toMatchObject({ curtainVisible: true, wakeLock: true })
    restored.revealHandoff()
    expect(restored.burn('Banana', 'persisted-command')).toBe(false)
  })
})
