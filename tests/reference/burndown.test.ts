import { describe, expect, it } from 'vitest'
import { BurndownController } from '../../examples/burndown/lib/burndown'
import { normalizeBurndownSystemPath } from '../../examples/burndown/lib/link'

describe('Burndown native acceptance model', () => {
  it('composes durable account OAuth independently from guest play', async () => {
    const game = new BurndownController()
    await game.signInOAuth('google')
    expect(game.state).toMatchObject({
      phase: 'lobby',
      mode: 'phones',
      identityStatus: 'account',
      identityEmail: 'burn@example.com',
    })
    await game.signOutAccount()
    expect(game.state.identityStatus).toBe('guest')
  })

  it('composes passkey identity, host admission, and spectator TV entry', async () => {
    const game = new BurndownController()
    await game.registerPasskey('android')
    await game.signInPasskey()
    game.setAdmissionPolicy('approval')
    game.requestAdmission('tv', 'Living Room TV', 'spectator')
    expect(game.state).toMatchObject({ identityStatus: 'passkey', passkeyCount: 1 })
    expect(game.admissionQueue()).toEqual([
      expect.objectContaining({ id: 'tv', role: 'spectator', status: 'pending' }),
    ])
    game.decideAdmission('tv', true)
    expect(game.lobbyProjection().members).toContainEqual(
      expect.objectContaining({ id: 'tv', role: 'spectator' }),
    )
  })

  it('adds admitted participants to the authoritative player roster', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.setAdmissionPolicy('approval')
    game.requestAdmission('p3', 'Jo')
    game.decideAdmission('p3', true)
    expect(game.state.players).toContainEqual({
      id: 'p3',
      name: 'Jo',
      seat: 2,
      lives: 3,
      eliminated: false,
    })
  })

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

  it('configures a 6–8 seat shared table with every player challenge-eligible', () => {
    const game = new BurndownController()
    game.configureSharedTable(8)
    expect(game.state.players).toHaveLength(8)
    expect(game.state.players.map((player) => player.seat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    game.enter('shared')
    game.start()
    game.revealHandoff()
    game.openChallenge()
    for (const player of game.state.players) game.vote(player.id, 'nobody')
    expect(game.resolveChallenge()).toBe('nobody')
    expect(() => new BurndownController().configureSharedTable(9)).toThrow('between 2 and 8')
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

  it('bulk edits, autosaves, duplicates, and archives category decks', () => {
    const game = new BurndownController()
    game.bulkAddCategories('Things in a backpack\nFoods at a picnic\nThings in a backpack')
    game.renameCategoryDeck('Weekend categories')
    game.duplicateCategoryDeck()
    expect(game.categories.snapshot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'starter',
          title: 'Weekend categories',
          items: expect.arrayContaining([
            { category: 'Things in a backpack' },
            { category: 'Foods at a picnic' },
          ]),
        }),
        expect.objectContaining({ id: 'starter-copy', status: 'draft' }),
      ]),
    )
    game.archiveCategoryDeck()
    expect(game.categories.snapshot.find((deck) => deck.id === 'starter-copy')?.status).toBe(
      'archived',
    )
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

  it('requires reviewed host termination and exposes public activity and native sharing data', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.start()
    expect(() => game.confirmEndMatch()).toThrow('confirmation')
    game.requestEndMatch()
    game.cancelEndMatch()
    expect(game.state.endConfirmationPending).toBe(false)
    game.requestEndMatch()
    game.confirmEndMatch()
    game.reactToLatest('p2', '🔥')
    expect(game.activityProjection().at(-1)).toMatchObject({
      kind: 'match-end',
      reactions: { '🔥': ['p2'] },
    })
    expect(game.resultsSharePayload()).toMatchObject({
      title: 'Burndown results',
      message: expect.stringContaining('Burndown'),
    })
  })

  it('tracks alive, burned, and void letters and deterministically resets exhaustion', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.stageRules({ boardExhaustion: 'reset', speedUpMs: 500, warningMs: 4_000 })
    game.start()
    expect(game.board()[0]).toEqual({ letter: 'A', status: 'active' })
    expect(game.burn('Apple', 'a')).toBe(true)
    expect(game.board()[0].status).toBe('burned')
    expect(game.state.letter).toBe('B')
    game.voidLetter('C')
    expect(game.board()[2].status).toBe('void')
    for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') game.voidLetter(letter)
    game.voidLetter('B')
    expect(game.state).toMatchObject({
      letter: 'A',
      notice: 'Board reset for a new round',
      phase: 'turn',
    })
    expect(game.board().filter((entry) => entry.status === 'void')).toHaveLength(0)
  })

  it('validates advanced timing and challenge rules', () => {
    const game = new BurndownController()
    expect(() => game.stageRules({ warningMs: 20_000 })).toThrow('timing')
    game.stageRules({ challenge: false })
    game.enter('phones')
    game.start()
    expect(() => game.openChallenge()).toThrow('disabled')
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

  it('persists active/history dashboard recovery and creates a rematch record', () => {
    const game = new BurndownController()
    game.enter('phones')
    game.start()
    expect(game.games.page({ scope: 'active' }).items[0]).toMatchObject({
      status: 'active',
      resumable: true,
    })
    const restored = new BurndownController(game.exportSnapshot())
    expect(restored.games.page({ scope: 'active' }).items).toHaveLength(1)
    restored.endMatch()
    expect(restored.games.page({ scope: 'history' }).items).toHaveLength(1)
    restored.rematch('dashboard-rematch')
    expect(restored.games.snapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'burndown-dashboard-rematch',
          status: 'lobby',
          rematchOf: 'burndown-game-1',
        }),
      ]),
    )
  })
})
