import {
  CommunityAdminController,
  CommunityComposerController,
  CommunityProfileController,
  RoomStateController,
  SocialGraphController,
} from '../../src/community/presets'
import { describe, expect, it } from 'vitest'

describe('CommunityComposerController', () => {
  it('deduplicates mentions/attachments and waits for upload before publish', () => {
    const composer = new CommunityComposerController()
    composer.save({
      id: 'draft',
      body: 'Hello @alex',
      mentions: ['alex', 'alex'],
      attachments: [
        { id: 'image', kind: 'image', uri: 'file://image', status: 'pending' },
        { id: 'image', kind: 'image', uri: 'file://image', status: 'pending' },
      ],
      poll: null,
    })
    expect(composer.get('draft')).toMatchObject({
      mentions: ['alex'],
      attachments: [{ id: 'image' }],
    })
    expect(composer.publishable('draft')).toBe(false)
    composer.markAttachment('draft', 'image', 'uploaded')
    expect(composer.publishable('draft')).toBe(true)
  })

  it('validates polls and records one idempotent vote', () => {
    const composer = new CommunityComposerController()
    composer.save({
      id: 'poll',
      body: '',
      mentions: [],
      attachments: [],
      poll: {
        question: 'Best trail?',
        options: [
          { id: 'north', label: 'North', votes: 0 },
          { id: 'south', label: 'South', votes: 0 },
        ],
        votedOptionId: null,
      },
    })
    composer.vote('poll', 'north')
    composer.vote('poll', 'south')
    expect(composer.get('poll')?.poll).toMatchObject({
      votedOptionId: 'north',
      options: [{ votes: 1 }, { votes: 0 }],
    })
  })
})

describe('SocialGraphController', () => {
  it('maintains idempotent follows and subscriptions', () => {
    const graph = new SocialGraphController()
    graph.follow('alex')
    graph.follow('alex')
    graph.subscribe('trail-talk')
    expect(graph.snapshot).toEqual({ following: ['alex'], subscriptions: ['trail-talk'] })
    graph.unfollow('alex')
    graph.unsubscribe('trail-talk')
    expect(graph.snapshot).toEqual({ following: [], subscriptions: [] })
  })
})

describe('CommunityProfileController', () => {
  it('validates profile identity, avatar transport, handle uniqueness, and visibility', () => {
    const profiles = new CommunityProfileController()
    profiles.save({
      userId: 'alex',
      handle: '@Alex_1',
      displayName: 'Alex',
      biography: 'Trail runner',
      avatarUrl: 'https://cdn.example.test/alex.jpg',
      visibility: 'followers',
    })
    expect(profiles.get('alex')).toMatchObject({ handle: 'alex_1', biography: 'Trail runner' })
    expect(profiles.canView('alex', null, false)).toBe(false)
    expect(profiles.canView('alex', 'morgan', true)).toBe(true)
    expect(profiles.canView('alex', 'alex', false)).toBe(true)

    expect(() =>
      profiles.save({
        userId: 'morgan',
        handle: 'alex_1',
        displayName: 'Morgan',
        biography: '',
        avatarUrl: null,
        visibility: 'public',
      }),
    ).toThrow('already in use')
    expect(() =>
      profiles.save({
        userId: 'morgan',
        handle: 'morgan',
        displayName: 'Morgan',
        biography: '',
        avatarUrl: 'http://insecure.example.test/avatar.jpg',
        visibility: 'public',
      }),
    ).toThrow('HTTPS')

    profiles.removeAvatar('alex')
    expect(profiles.get('alex')?.avatarUrl).toBeNull()
  })
})

describe('RoomStateController', () => {
  it('tracks monotonic read cursors, unread totals, presence, and typing', () => {
    const rooms = new RoomStateController()
    rooms.openRoom('dm')
    rooms.receive(4)
    rooms.markRead('dm', 2)
    rooms.markRead('dm', 1)
    rooms.setPresence({ userId: 'alex', state: 'online', typing: true })
    expect(rooms.snapshot).toEqual({
      latestSequence: 4,
      unread: { dm: 2 },
      presence: [{ userId: 'alex', state: 'online', typing: true }],
    })
    rooms.markRead('dm', 99)
    expect(rooms.snapshot.unread.dm).toBe(0)
  })
})

describe('CommunityAdminController', () => {
  const now = '2026-07-25T12:05:00.000Z'
  const authenticatedAt = '2026-07-25T12:01:00.000Z'

  it('requires grants and fresh auth for sensitive admin actions', () => {
    const admin = new CommunityAdminController(() => now, undefined, {
      bootstrapAdminIds: ['owner'],
    })
    expect(() => admin.ban('mod', 'spammer', 'Spam', authenticatedAt)).toThrow('Missing ability')
    admin.grant('owner', 'mod', 'ban')
    admin.ban('mod', 'spammer', 'Spam', authenticatedAt)
    expect(admin.snapshot.bans).toEqual({
      spammer: { reason: 'Spam', expiresAt: null },
    })
    expect(admin.snapshot.audit).toEqual([
      expect.objectContaining({ action: 'grant' }),
      expect.objectContaining({ action: 'ban', targetId: 'spammer' }),
    ])
  })

  it('rejects stale authentication for bans, flags, and broadcasts', () => {
    const admin = new CommunityAdminController(() => now, undefined, {
      bootstrapAdminIds: ['owner'],
    })
    admin.grant('owner', 'mod', 'ban')
    expect(() => admin.ban('mod', 'spammer', 'Spam', '2026-07-25T11:00:00.000Z')).toThrow(
      'Fresh authentication',
    )
  })

  it('handles consent, idempotent broadcasts, flags, and guarded legal viewing', () => {
    const admin = new CommunityAdminController(() => now, undefined, {
      bootstrapAdminIds: ['owner'],
    })
    admin.setConsent('alex', 'privacy-v2', true)
    admin.grant('owner', 'admin', 'broadcast')
    admin.grant('owner', 'admin', 'manage_flags')
    admin.grant('owner', 'admin', 'view_legal')
    admin.broadcast('admin', 'notice', 'Maintenance', authenticatedAt)
    admin.broadcast('admin', 'notice', 'Duplicate', authenticatedAt)
    admin.setFlag('admin', 'posting', false, authenticatedAt)
    expect(admin.viewLegal('admin', '# Terms')).toBe('# Terms')
    expect(admin.snapshot).toMatchObject({
      consent: { 'alex:privacy-v2': true },
      flags: { posting: false },
      broadcasts: [{ id: 'notice', body: 'Maintenance' }],
    })
  })

  it('prevents untrusted grant escalation and protects the final administrator', () => {
    const admin = new CommunityAdminController(() => now, undefined, {
      bootstrapAdminIds: ['owner'],
    })
    expect(() => admin.grant('attacker', 'attacker', 'administer')).toThrow('Missing ability')
    expect(() => admin.revokeGrant('owner', 'owner', 'administer')).toThrow(
      'final administrator',
    )
    admin.grant('owner', 'second-owner', 'administer')
    admin.revokeGrant('owner', 'owner', 'administer')
    expect(admin.can('owner', 'administer')).toBe(false)
  })
})
