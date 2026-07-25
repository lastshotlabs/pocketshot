import { describe, expect, it } from 'vitest'
import { BlankSlateController } from '../../examples/blankslate/lib/blankslate'
import { normalizeBlankSlateSystemPath } from '../../examples/blankslate/lib/link'

function submittedRound(game: BlankSlateController) {
  game.enter()
  game.startRound()
  game.submit('p1', 'cake', 'p1')
  game.submit('p2', 'cake', 'p2')
  game.submit('p3', 'party', 'p3')
}

describe('Blank Slate native acceptance model', () => {
  it('normalizes cold native joins and rejects expired invites', () => {
    expect(normalizeBlankSlateSystemPath('pocketshot-blankslate://join/SLATE-42')).toBe(
      '/join/SLATE-42',
    )
    expect(normalizeBlankSlateSystemPath('pocketshot-blankslate://join/%E0%A4%A')).toBe('/')
    const game = new BlankSlateController()
    expect(game.join('expired')).toBe(false)
    expect(game.join('slate-42')).toBe(true)
    expect(game.state.phase).toBe('lobby')
  })

  it('redacts every other private word before reveal', () => {
    const game = new BlankSlateController()
    submittedRound(game)
    expect(game.privateProjection('p1')).toEqual([
      expect.objectContaining({ actorId: 'p1', value: 'cake' }),
      { actorId: 'p2', submitted: true },
      { actorId: 'p3', submitted: true },
    ])
    expect(game.tvProjection()).not.toHaveProperty('groups')
  })

  it('groups reveal answers, scores matches, and supports voting', () => {
    const game = new BlankSlateController()
    submittedRound(game)
    game.reveal()
    expect(game.state.groups.map((group) => group.playerIds.length)).toEqual([2, 1])
    game.openMergeVote()
    game.vote('p1', game.state.groups[0].id, true)
    expect(game.closeVote().values().next().value).toBe(1)
    game.scoreRound()
    expect(game.state.players.map((player) => player.score)).toEqual([2, 2, 0])
  })

  it('merges, splits, and exactly restores host corrections', () => {
    const game = new BlankSlateController()
    submittedRound(game)
    game.reveal()
    const original = game.state.groups
    game.merge(original.map((group) => group.id))
    expect(game.state.groups).toHaveLength(1)
    game.split(game.state.groups[0].id)
    expect(game.undoCorrection()).toBe(true)
    expect(game.state.groups).toHaveLength(1)
    expect(game.undoCorrection()).toBe(true)
    expect(game.state.groups).toEqual(original)
  })

  it('enforces cue structure and publishes reviewed prompt proposals', () => {
    const game = new BlankSlateController()
    expect(() => game.proposePrompts('bad', ['No blank here'], 'Invalid proposal')).toThrow(
      'exactly one blank',
    )
    game.proposePrompts('good', ['Summer ___'], 'Adds a seasonal cue')
    game.reviewPromptProposal('good', true)
    expect(game.prompts.browse({ query: 'summer' }).items).toHaveLength(1)
    game.publishPrompts()
    expect(game.prompts.snapshot[0].status).toBe('published')
  })

  it('supports staged win rules, score correction, and host termination', () => {
    const game = new BlankSlateController()
    game.stageWinRules({ targetScore: 20 })
    game.adjustScore('p1', 4)
    game.endMatch()
    expect(game.state).toMatchObject({ phase: 'results', ended: true, winnerIds: ['p1'] })
    game.rematch('new-rules')
    expect(game.state).toMatchObject({ phase: 'lobby', ended: false, targetScore: 20 })
  })

  it('runs fixed-round sudden death and host recovery lifecycle', () => {
    const game = new BlankSlateController()
    game.enter()
    game.stageWinRules({ winMode: 'fixed-rounds', fixedRounds: 1 })
    game.startRound()
    game.submit('p1', 'same', 'one')
    game.submit('p2', 'same', 'two')
    game.submit('p3', 'unique', 'three')
    game.reveal()
    game.scoreRound()
    expect(game.state).toMatchObject({
      winMode: 'fixed-rounds',
      fixedRounds: 1,
      phase: 'sudden-death',
    })
    expect(game.recoverHost()).toBe('p2')
    game.pause()
    expect(game.state.paused).toBe(true)
    game.resume()
    expect(game.state.paused).toBe(false)
  })

  it('restores private drafts and ballots without projection leakage after process death', () => {
    const game = new BlankSlateController()
    submittedRound(game)
    const writing = new BlankSlateController(game.exportSnapshot())
    expect(writing.privateProjection('p1')[1]).not.toHaveProperty('value')
    writing.reveal()
    writing.openMergeVote()
    writing.vote('p1', writing.state.groups[0].id, true)
    const voting = new BlankSlateController(writing.exportSnapshot())
    expect(voting.closeVote().get(writing.state.groups[0].id)).toBe(1)
  })
})
