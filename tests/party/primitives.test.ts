import { describe, expect, it } from 'vitest'
import {
  BallotController,
  ContentLibraryController,
  HostCorrectionController,
  PartySessionController,
  PersonalCuePolicy,
  PrivateSubmissionController,
  SharedDeviceController,
  TimedPhaseController,
} from '../../src/party-session'

describe('party lifecycle primitives', () => {
  it('recovers a host, stages rules, and deduplicates rematches', () => {
    const party = new PartySessionController({ rounds: 5 })
    party.join({ id: 'h', displayName: 'Host', role: 'host', seat: 1, connected: true })
    party.join({ id: 'p', displayName: 'Player', role: 'participant', seat: 0, connected: true })
    party.stageRules('h', { rounds: 7 })
    party.setConnected('h', false)
    expect(party.recoverHost()).toBe('p')
    expect(party.startRematch('p', 'rematch-1')).toBe(true)
    expect(party.startRematch('p', 'rematch-1')).toBe(false)
    expect(party.snapshot.rules.rounds).toBe(7)
  })

  it('supports host admission, removal, blocking, and an allowlisted public projection', () => {
    const party = new PartySessionController({ rounds: 5, secretAnswer: 'private' })
    party.join({ id: 'h', displayName: 'Host', role: 'host', seat: 0, connected: true })
    party.setAdmissionPolicy('h', 'approval')
    expect(
      party.requestAdmission({
        id: 'p',
        displayName: 'Player',
        role: 'participant',
        requestedAt: 1,
      }),
    ).toBe('pending')
    expect(() =>
      party.join({ id: 'p', displayName: 'Player', role: 'participant', seat: 1, connected: true }),
    ).toThrow('not been admitted')
    party.decideAdmission('h', 'p', true)
    party.join({ id: 'p', displayName: 'Player', role: 'participant', seat: 1, connected: true })
    party.block('h', 'p')
    expect(() =>
      party.join({ id: 'p', displayName: 'Player', role: 'participant', seat: 1, connected: true }),
    ).toThrow('blocked')
    expect(party.publicProjection()).not.toHaveProperty('admissionQueue')
    expect(party.publicProjection()).not.toHaveProperty('blockedMemberIds')
    party.unblock('h', 'p')
  })

  it('reconciles an authoritative timer across pause and background time', () => {
    let now = 1_000
    const timer = new TimedPhaseController('write', 10_000, () => now)
    now = 8_000
    expect(timer.remainingMs()).toBe(3_000)
    expect(timer.isWarning(3_000)).toBe(true)
    timer.pause()
    now = 30_000
    expect(timer.remainingMs()).toBe(3_000)
    timer.resume()
    now = 33_000
    expect(timer.reconcile()).toBe(true)
    expect(timer.snapshot.completed).toBe(true)
  })

  it('keeps submissions private, supports edit windows, and deduplicates replay', () => {
    let now = 1_000
    const submissions = new PrivateSubmissionController<string>(5_000, () => now)
    expect(submissions.submit('a', 'secret', 'one')).toBe(true)
    expect(submissions.submit('a', 'secret', 'one')).toBe(false)
    expect(submissions.projection('b', false)[0]).not.toHaveProperty('value')
    expect(submissions.projection('a', false)[0]).toHaveProperty('value', 'secret')
    now = 7_000
    expect(() => submissions.submit('a', 'late', 'two')).toThrow('closed')
    expect(submissions.projection('tv', true)[0]).toHaveProperty('value', 'secret')
  })

  it('tracks submission acknowledgement, rejection, and idempotent resend', () => {
    const submissions = new PrivateSubmissionController<string>(5_000)
    submissions.submit('a', 'secret', 'submit-1')
    submissions.reject('a', 'stale-key', 'ignored')
    expect(submissions.snapshot[0].deliveryStatus).toBe('pending')
    submissions.reject('a', 'submit-1', 'network rejected')
    expect(submissions.snapshot[0]).toMatchObject({
      deliveryStatus: 'rejected',
      rejectionReason: 'network rejected',
    })
    expect(submissions.resend('a', 'submit-2')).toBe(true)
    expect(submissions.resend('a', 'submit-2')).toBe(false)
    submissions.acknowledge('a', 'submit-2')
    expect(submissions.snapshot[0]).toMatchObject({ deliveryStatus: 'accepted' })
  })

  it('supports cumulative ballot approval and revocation', () => {
    const ballot = new BallotController<'merge' | 'nobody'>(['a', 'b'])
    ballot.set('a', 'merge', true)
    ballot.set('a', 'nobody', true)
    ballot.set('a', 'nobody', false)
    ballot.set('b', 'merge', true)
    expect(ballot.close().get('merge')).toBe(2)
    expect(() => ballot.set('a', 'merge', false)).toThrow('closed')
  })

  it('deduplicates and orders authoritative ballot events', () => {
    const ballot = new BallotController<'merge'>(['a'])
    expect(
      ballot.applyEvent({
        id: 'event-1',
        sequence: 1,
        voterId: 'a',
        choice: 'merge',
        approved: true,
      }),
    ).toBe(true)
    expect(
      ballot.applyEvent({
        id: 'event-1',
        sequence: 1,
        voterId: 'a',
        choice: 'merge',
        approved: true,
      }),
    ).toBe(false)
    expect(() =>
      ballot.applyEvent({
        id: 'event-3',
        sequence: 3,
        voterId: 'a',
        choice: 'merge',
        approved: false,
      }),
    ).toThrow('sequence gap')
  })

  it('requires arm/propose/confirm and restores correction history', () => {
    const correction = new HostCorrectionController(
      { groups: [['a'], ['b']] },
      undefined,
      () => 100,
    )
    correction.arm('moderator-1')
    correction.propose({ groups: [['a', 'b']] })
    expect(correction.confirm()).toBe(1)
    expect(correction.snapshot.state.groups).toEqual([['a', 'b']])
    expect(correction.undo()).toBe(true)
    expect(correction.snapshot.state.groups).toEqual([['a'], ['b']])
    expect(correction.snapshot.version).toBe(2)
    expect(correction.snapshot.audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: 'confirm', actorId: 'moderator-1' }),
        expect.objectContaining({ operation: 'undo', version: 2 }),
      ]),
    )
  })

  it('rejects stale correction proposals and confirmations', () => {
    const correction = new HostCorrectionController({ score: 1 })
    correction.arm()
    expect(() => correction.propose({ score: 2 }, 1)).toThrow('version conflict')
    correction.propose({ score: 2 }, 0)
    expect(() => correction.confirm(1)).toThrow('version conflict')
  })

  it('protects pass-the-phone handoff and in-flight commands', () => {
    const shared = new SharedDeviceController()
    shared.begin(2)
    expect(shared.snapshot).toMatchObject({ curtainVisible: true, wakeLock: true })
    shared.arm(2)
    expect(shared.lockCommand('burn-a')).toBe(true)
    expect(shared.lockCommand('burn-a')).toBe(false)
    shared.settleCommand('burn-a')
    shared.end()
    expect(shared.snapshot.wakeLock).toBe(false)
  })

  it('delivers actor-only cues with mute, quiet-hour, lifecycle, and duplicate policy', () => {
    const cue = new PersonalCuePolicy(5_000)
    const request = {
      roomId: 'room',
      eventId: 'turn',
      actorId: 'a',
      recipientId: 'a',
      at: new Date(2026, 0, 1, 12).getTime(),
    }
    expect(cue.shouldDeliver(request, 'active')).toBe(true)
    expect(cue.shouldDeliver({ ...request, at: request.at + 1_000 }, 'active')).toBe(false)
    expect(cue.shouldDeliver({ ...request, eventId: 'other' }, 'suspended')).toBe(false)
    cue.setRoomMuted('room', true)
    expect(cue.shouldDeliver({ ...request, eventId: 'muted' }, 'active')).toBe(false)
  })

  it('provides versioned content browse, ownership, workflow, and AI review', () => {
    let now = 1
    const library = new ContentLibraryController<{ cue: string }>(
      (item) => (item.cue.includes('___') ? [] : ['Cue must contain a blank']),
      (item) => item.cue,
      () => now++,
    )
    library.create('one', 'alex', 'Party prompts')
    expect(library.appendItems('one', 'alex', 1, [{ cue: 'Birthday ___' }])).toBe(2)
    expect(() => library.appendItems('one', 'sam', 2, [{ cue: 'Summer ___' }])).toThrow('owner')
    expect(() => library.appendItems('one', 'alex', 1, [{ cue: 'Summer ___' }])).toThrow(
      'Revision conflict',
    )
    library.addProposal({
      id: 'proposal',
      collectionId: 'one',
      items: [{ cue: 'Summer ___' }],
      rationale: 'Adds a seasonal cue',
    })
    library.reviewProposal('proposal', 'alex', true)
    expect(library.browse({ query: 'summer' }).items).toHaveLength(1)
    expect(library.health('one')).toMatchObject({ itemCount: 2, publishable: true })
    library.submit('one', 'alex')
    library.approve('one')
    library.publish('one')
    expect(library.snapshot[0].status).toBe('published')
    library.unpublish('one')
    expect(library.snapshot[0].status).toBe('approved')
  })
})
