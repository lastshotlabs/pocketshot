import { describe, expect, it, vi } from 'vitest'
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
  it('composes player profile, quickplay, and validated custom setup', () => {
    const game = new BlankSlateController()
    game.updateProfile('Alex Rivera', 'https://cdn.example.test/alex.jpg')
    game.applyPreset('marathon')
    expect(game.state).toMatchObject({
      profile: {
        displayName: 'Alex Rivera',
        avatarUrl: 'https://cdn.example.test/alex.jpg',
      },
      preset: 'marathon',
      winMode: 'fixed-rounds',
      fixedRounds: 10,
      writeMs: 45_000,
      hostParticipates: true,
      selectedDeckId: 'starter',
    })
    game.configureSetup({
      targetScore: 18,
      winMode: 'target-score',
      writeMs: 35_000,
      hostParticipates: false,
    })
    expect(game.state).toMatchObject({
      preset: 'custom',
      targetScore: 18,
      winMode: 'target-score',
      writeMs: 35_000,
      hostParticipates: false,
    })
    expect(() => game.configureSetup({ writeMs: 1_000 })).toThrow('Write timer')
    expect(() => game.configureSetup({ selectedDeckId: 'missing' })).toThrow('Unknown prompt deck')
  })

  it('durably replays offline answers and merge votes once after process restoration', async () => {
    const writing = new BlankSlateController()
    writing.enter()
    writing.startRound()
    await writing.queueAnswer('p1', 'cake', 'offline-answer')
    await writing.queueAnswer('p1', 'cake', 'offline-answer')
    expect(writing.pendingOfflineCommandCount).toBe(1)
    const restoredWriting = new BlankSlateController(writing.exportSnapshot())
    expect(restoredWriting.pendingOfflineCommandCount).toBe(1)
    expect(await restoredWriting.replayOfflineCommands()).toBe(1)
    expect(restoredWriting.state.submittedIds).toEqual(['p1'])
    expect(restoredWriting.pendingOfflineCommandCount).toBe(0)
    expect(await restoredWriting.replayOfflineCommands()).toBe(0)

    const voting = new BlankSlateController()
    voting.enter()
    voting.startRound()
    voting.submit('p1', 'cake', 'one')
    voting.submit('p2', 'cake', 'two')
    voting.submit('p3', 'party', 'three')
    voting.reveal()
    voting.openMergeVote()
    const groupId = voting.state.groups[0].id
    await voting.queueMergeVote('p1', groupId, true, 'offline-vote')
    const restoredVoting = new BlankSlateController(voting.exportSnapshot())
    expect(await restoredVoting.replayOfflineCommands()).toBe(1)
    expect(restoredVoting.closeVote().get(groupId)).toBe(1)
  })

  it('composes Apple/Google OAuth and passkey entry without native-module coupling', async () => {
    const account = new BlankSlateController()
    await account.signInOAuth('apple')
    expect(account.state).toMatchObject({
      phase: 'lobby',
      identityStatus: 'account',
      identityEmail: 'slate@example.com',
    })

    const passkey = new BlankSlateController()
    await passkey.registerPasskey('android')
    expect(passkey.state.passkeyCount).toBe(1)
    await passkey.signInPasskey()
    expect(passkey.state).toMatchObject({
      phase: 'lobby',
      identityStatus: 'passkey',
      identityEmail: 'slate@example.com',
    })
    await passkey.removePasskey()
    expect(passkey.state.passkeyCount).toBe(0)
  })

  it('runs host admission for participants and spectators with public-safe projection', () => {
    const game = new BlankSlateController()
    game.enter()
    game.setAdmissionPolicy('approval')
    expect(game.requestAdmission('p4', 'Rae')).toBe('pending')
    expect(game.requestAdmission('tv', 'Living Room TV', 'spectator')).toBe('pending')
    expect(game.admissionQueue()).toEqual([
      expect.objectContaining({ id: 'p4', status: 'pending' }),
      expect.objectContaining({ id: 'tv', role: 'spectator', status: 'pending' }),
    ])
    game.decideAdmission('p4', true)
    game.decideAdmission('tv', true)
    expect(game.state.players).toContainEqual({ id: 'p4', name: 'Rae', score: 0 })
    expect(game.lobbyProjection().members).toContainEqual(
      expect.objectContaining({ id: 'tv', role: 'spectator', seat: null }),
    )
    expect(game.lobbyProjection()).not.toHaveProperty('admissionQueue')
  })

  it('delivers only personal push categories with room mute and duplicate suppression', () => {
    const game = new BlankSlateController()
    expect(game.deliverPersonalPush('turn-to-write', 'p1', 'turn-1', 'background', 1_000)).toBe(
      true,
    )
    expect(game.deliverPersonalPush('turn-to-write', 'p1', 'turn-1', 'background', 2_000)).toBe(
      false,
    )
    expect(game.deliverPersonalPush('reaction', 'p1', 'reaction-1')).toBe(false)
    expect(game.deliverPersonalPush('rematch', 'p1', 'rematch-1', 'suspended')).toBe(false)
    game.setRoomMuted(true)
    expect(game.deliverPersonalPush('host-knock', 'p1', 'knock-1')).toBe(false)
    game.setRoomMuted(false)
    expect(game.deliverPersonalPush('final-score', 'p1', 'score-1')).toBe(true)
    expect(game.state.deliveredPushes).toEqual(['turn-to-write:turn-1', 'final-score:score-1'])
  })

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

  it('tracks optimistic lock, rejection, idempotent resend, and acknowledgement', () => {
    const game = new BlankSlateController()
    game.enter()
    game.startRound()
    game.submit('p1', 'cake', 'submit-1')
    expect(game.state.submissionStates.p1.status).toBe('pending')
    game.rejectSubmission('p1', 'submit-1', 'Connection lost')
    expect(game.state.submissionStates.p1).toEqual({
      status: 'rejected',
      reason: 'Connection lost',
    })
    expect(game.resendSubmission('p1', 'submit-2')).toBe(true)
    expect(game.resendSubmission('p1', 'submit-2')).toBe(false)
    game.acknowledgeSubmission('p1', 'submit-2')
    expect(game.state.submissionStates.p1.status).toBe('accepted')
    expect(game.tvProjection()).not.toHaveProperty('submissionStates')
  })

  it('emits native-safe lock, matched-reveal, and rejection feedback', () => {
    const feedback = {
      lockIn: vi.fn(),
      matchedReveal: vi.fn(),
      rejectedInput: vi.fn(),
    }
    const game = new BlankSlateController(undefined, feedback)
    game.enter()
    game.startRound()
    expect(game.submit('p1', '', 'empty')).toBe(false)
    game.submit('p1', 'cake', 'one')
    game.submit('p2', 'cake', 'two')
    game.submit('p3', 'party', 'three')
    game.rejectSubmission('p3', 'three', 'Connection lost')
    game.reveal()
    expect(feedback.rejectedInput).toHaveBeenCalledTimes(2)
    expect(feedback.lockIn).toHaveBeenCalledTimes(3)
    expect(feedback.matchedReveal).toHaveBeenCalledTimes(1)
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

  it('bulk edits, autosaves, duplicates, and archives prompt decks', () => {
    const game = new BlankSlateController()
    game.bulkAddPrompts('Summer ___\n___ station\nSummer ___')
    game.renamePromptDeck('Weekend prompts')
    game.duplicatePromptDeck()
    expect(game.prompts.snapshot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'starter',
          title: 'Weekend prompts',
          items: expect.arrayContaining([{ cue: 'Summer ___' }, { cue: '___ station' }]),
        }),
        expect.objectContaining({ id: 'starter-copy', status: 'draft' }),
      ]),
    )
    game.archivePromptDeck()
    expect(game.prompts.snapshot.find((deck) => deck.id === 'starter-copy')?.status).toBe(
      'archived',
    )
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

  it('requires reviewed host termination and exposes bounded public activity and sharing', () => {
    const game = new BlankSlateController()
    game.enter()
    game.startRound()
    expect(() => game.confirmEndMatch()).toThrow('confirmation')
    game.requestEndMatch()
    expect(game.state.endConfirmationPending).toBe(true)
    game.cancelEndMatch()
    expect(game.state.endConfirmationPending).toBe(false)
    game.requestEndMatch()
    game.confirmEndMatch()
    game.reactToLatest('p2', '👏')
    game.reactToLatest('p2', '👏')
    expect(game.activityProjection().at(-1)).toMatchObject({
      kind: 'match-end',
      reactions: {},
    })
    expect(game.resultsSharePayload()).toMatchObject({
      title: 'Blank Slate results',
      message: expect.stringContaining('Blank Slate'),
    })
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

  it('restores its game dashboard and records completed rematches', () => {
    const game = new BlankSlateController()
    game.enter()
    game.startRound()
    const restored = new BlankSlateController(game.exportSnapshot())
    expect(restored.games.page({ scope: 'active' }).items[0].status).toBe('active')
    restored.endMatch()
    expect(restored.games.page({ scope: 'history' }).items).toHaveLength(1)
    restored.rematch('dashboard')
    expect(restored.games.snapshot.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'blankslate-dashboard',
          status: 'lobby',
          rematchOf: 'blankslate-game-1',
        }),
      ]),
    )
  })
})
