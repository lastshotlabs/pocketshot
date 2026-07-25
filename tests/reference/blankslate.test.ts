import { describe, expect, it } from 'vitest'
import { BlankSlateController } from '../../examples/blankslate/lib/blankslate'

function submittedRound(game: BlankSlateController) {
  game.enter()
  game.startRound()
  game.submit('p1', 'cake', 'p1')
  game.submit('p2', 'cake', 'p2')
  game.submit('p3', 'party', 'p3')
}

describe('Blank Slate native acceptance model', () => {
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
})
