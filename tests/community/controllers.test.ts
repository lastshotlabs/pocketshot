import { describe, expect, it } from 'vitest'
import {
  AutomodController,
  CommunityAuthorizationController,
  CursorFeedController,
  DiscussionController,
  MessagingController,
  ModerationController,
  NotificationInboxController,
  PrivacyController,
} from '../../src/community/controllers'

describe('CursorFeedController', () => {
  it('deduplicates stable pages and rejects stale cursors', () => {
    const feed = new CursorFeedController<{ id: string; value: number }>()
    feed.replace({
      items: [
        { id: 'one', value: 1 },
        { id: 'one', value: 99 },
      ],
      nextCursor: 'cursor-1',
      version: 1,
    })
    feed.append(
      {
        items: [
          { id: 'one', value: 1 },
          { id: 'two', value: 2 },
        ],
        nextCursor: null,
        version: 2,
      },
      'cursor-1',
    )
    expect(feed.snapshot.items).toEqual([
      { id: 'one', value: 1 },
      { id: 'two', value: 2 },
    ])

    feed.append({ items: [{ id: 'three', value: 3 }], nextCursor: null, version: 3 }, 'stale')
    expect(feed.snapshot.isStale).toBe(true)
    expect(feed.snapshot.items).toHaveLength(2)
  })

  it('preserves anchors, rank order, item versions, and rolls back optimistic changes', () => {
    type Ranked = { id: string; rank: number; version: number }
    const feed = new CursorFeedController<Ranked>({
      compare: (left, right) => right.rank - left.rank,
      version: (item) => item.version,
    })
    feed.replace({
      items: [
        { id: 'low', rank: 1, version: 1 },
        { id: 'high', rank: 10, version: 1 },
      ],
      nextCursor: 'next',
      version: 1,
    })
    feed.setAnchor('low')
    expect(feed.anchorIndex()).toBe(1)
    feed.upsert({ id: 'high', rank: 0, version: 0 })
    expect(feed.snapshot.items[0].id).toBe('high')
    feed.optimisticRemove('remove-low', 'low')
    expect(feed.anchorIndex()).toBeNull()
    feed.settleOptimistic('remove-low', false)
    expect(feed.anchorIndex()).toBe(1)
    feed.optimisticUpsert('add', { id: 'top', rank: 20, version: 1 })
    feed.settleOptimistic('add', true)
    expect(feed.snapshot.items[0].id).toBe('top')
  })

  it('supports optimistic upsert and removal', () => {
    const feed = new CursorFeedController<{ id: string; value: number }>()
    feed.replace({ items: [{ id: 'one', value: 1 }], nextCursor: null, version: 1 })
    feed.upsert({ id: 'two', value: 2 })
    feed.upsert({ id: 'one', value: 10 })
    expect(feed.snapshot.items).toEqual([
      { id: 'one', value: 10 },
      { id: 'two', value: 2 },
    ])
    feed.remove('one')
    expect(feed.snapshot.items.map((item) => item.id)).toEqual(['two'])
  })
})

describe('DiscussionController', () => {
  it('maintains nested replies, tombstones, and idempotent reactions', () => {
    const discussion = new DiscussionController()
    discussion.createThread({ id: 'thread', title: 'Title', body: 'Body' })
    discussion.createReply({
      id: 'parent',
      threadId: 'thread',
      parentId: null,
      body: 'Parent',
    })
    discussion.createReply({
      id: 'child',
      threadId: 'thread',
      parentId: 'parent',
      body: 'Child',
    })
    discussion.react('reply', 'child', '👍', 'alex')
    discussion.react('reply', 'child', '👍', 'alex')
    discussion.deleteReply('parent')

    expect(discussion.getThread('thread')?.replyCount).toBe(2)
    expect(discussion.listReplies('thread')).toEqual([
      expect.objectContaining({ id: 'parent', deleted: true, body: '' }),
      expect.objectContaining({ id: 'child', reactionCount: 1 }),
    ])
  })

  it('supports saves, poll revotes, and nested deep-link anchors', () => {
    const discussion = new DiscussionController()
    discussion.createThread({ id: 'thread', title: 'Topic', body: 'Body' })
    discussion.createReply({
      id: 'parent',
      threadId: 'thread',
      parentId: null,
      body: 'Parent',
    })
    discussion.createReply({
      id: 'child',
      threadId: 'thread',
      parentId: 'parent',
      body: 'Child',
    })
    discussion.setSaved('thread', 'alex', true)
    expect(discussion.isSaved('thread', 'alex')).toBe(true)
    discussion.createPoll('thread', [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
    ])
    discussion.votePoll('thread', 'alex', 'one')
    discussion.votePoll('thread', 'alex', 'two')
    expect(discussion.getPoll('thread')?.options).toEqual([
      expect.objectContaining({ id: 'one', votes: 0 }),
      expect.objectContaining({ id: 'two', votes: 1 }),
    ])
    expect(discussion.resolveAnchor('thread', 'child')).toMatchObject({
      reply: { id: 'child' },
      ancestors: [{ id: 'parent' }],
    })
  })

  it('rejects a parent from another thread', () => {
    const discussion = new DiscussionController()
    discussion.createThread({ id: 'one', title: 'One', body: 'One' })
    discussion.createThread({ id: 'two', title: 'Two', body: 'Two' })
    discussion.createReply({ id: 'parent', threadId: 'one', parentId: null, body: 'Parent' })
    expect(() =>
      discussion.createReply({
        id: 'child',
        threadId: 'two',
        parentId: 'parent',
        body: 'Child',
      }),
    ).toThrow('does not belong')
  })
})

describe('NotificationInboxController', () => {
  it('reconciles sequence, duplicate delivery, preferences, and read state', () => {
    const inbox = new NotificationInboxController()
    inbox.setPreference('marketing', false)
    inbox.receive({ id: 'one', sequence: 1, category: 'reply', text: 'Reply' })
    inbox.receive({ id: 'one', sequence: 1, category: 'reply', text: 'Duplicate' })
    inbox.receive({ id: 'two', sequence: 2, category: 'marketing', text: 'Offer' })
    expect(inbox.snapshot).toMatchObject({ unread: 1, lastSequence: 2 })
    expect(inbox.snapshot.items.map((item) => item.id)).toEqual(['one'])
    inbox.markAllRead()
    expect(inbox.snapshot.unread).toBe(0)
  })

  it('reconciles per-channel unread cursors and safe push-open routes', () => {
    const notifications = new NotificationInboxController()
    expect(
      notifications.applyEvent({
        eventId: 'event-1',
        notification: {
          id: 'one',
          sequence: 1,
          category: 'reply',
          channel: 'community',
          text: 'New reply',
          route: '/threads/thread-1#reply-2',
        },
      }),
    ).toBe(true)
    expect(
      notifications.applyEvent({
        eventId: 'event-1',
        notification: {
          id: 'one',
          sequence: 1,
          category: 'reply',
          text: 'duplicate',
        },
      }),
    ).toBe(false)
    expect(notifications.snapshot.unreadByChannel).toEqual({ community: 1 })
    expect(notifications.openRoute('one', ['/threads'])).toEqual({
      notificationId: 'one',
      route: '/threads/thread-1#reply-2',
    })
    expect(notifications.snapshot).toMatchObject({
      unread: 0,
      readCursors: { community: 1 },
    })
    expect(() =>
      notifications.applyEvent({
        eventId: 'event-3',
        notification: {
          id: 'three',
          sequence: 3,
          category: 'reply',
          text: 'gap',
        },
      }),
    ).toThrow('sequence gap')
    notifications.receive({
      id: 'absolute',
      sequence: 2,
      category: 'reply',
      text: 'Unsafe',
      route: 'https://evil.example/threads/thread-1',
    })
    expect(() => notifications.openRoute('absolute', ['/threads'])).toThrow('app-relative')
  })
})

describe('MessagingController', () => {
  it('deduplicates client sends and fails pending work after revocation', () => {
    const messages = new MessagingController()
    messages.send({ id: 'local', clientId: 'client-1', body: 'Hello' })
    messages.send({ id: 'local', clientId: 'client-1', body: 'Hello' })
    messages.revokeAccess()
    expect(messages.snapshot.messages).toEqual([
      expect.objectContaining({ clientId: 'client-1', status: 'failed' }),
    ])
    expect(() => messages.send({ id: 'local-2', clientId: 'client-2', body: 'No access' })).toThrow(
      'revoked',
    )
  })

  it('supports room membership, attachments, history, retry, presence, and reconnect', () => {
    const messages = new MessagingController()
    messages.configureMembers(['alex', 'sam'])
    messages.setTyping('sam', true)
    messages.setPresence('sam', 'online')
    messages.send({
      id: 'local-1',
      clientId: 'client-1',
      body: '',
      conversationId: 'room-1',
      attachments: [{ id: 'image-1', url: 'https://example.com/a.jpg', mediaType: 'image/jpeg' }],
      createdAt: '2026-07-25T12:00:00.000Z',
    })
    messages.fail('client-1')
    messages.retry('client-1')
    expect(messages.history({ conversationId: 'room-1', limit: 1 }).items[0]).toMatchObject({
      status: 'pending',
      attachments: [{ id: 'image-1' }],
    })
    messages.setConnection('reconnecting')
    expect(messages.snapshot).toMatchObject({
      members: ['alex', 'sam'],
      typing: ['sam'],
      presence: { sam: 'online' },
      connection: 'reconnecting',
    })
  })

  it('purges sensitive conversation state on authorization revocation when requested', () => {
    const messages = new MessagingController()
    messages.configureMembers(['alex', 'sam'])
    messages.setTyping('sam', true)
    messages.setPresence('sam', 'online')
    messages.send({ id: 'local', clientId: 'client', body: 'Private' })
    messages.revokeAccess({ clearMessages: true, clearMembership: true })
    expect(messages.snapshot).toMatchObject({
      access: 'revoked',
      messages: [],
      members: [],
      typing: [],
      presence: {},
    })
  })
})

describe('ModerationController', () => {
  it('records assignment and resolution in an immutable audit trail', () => {
    const moderation = new ModerationController(() => '2026-07-25T00:00:00.000Z')
    moderation.submit({ id: 'report', targetId: 'thread', reason: 'Spam' })
    moderation.assign('report', 'moderator')
    moderation.resolve('report', 'moderator', 'remove', 'Confirmed spam')
    moderation.resolve('report', 'moderator', 'ban', 'Duplicate resolution')

    expect(moderation.snapshot.reports[0]).toMatchObject({
      status: 'resolved',
      assigneeId: 'moderator',
    })
    expect(moderation.snapshot.audit).toEqual([
      expect.objectContaining({ action: 'assign' }),
      expect.objectContaining({ action: 'remove', reason: 'Confirmed spam' }),
    ])
  })

  it('requires explicit confirmation for proposed actions and retains moderator notes', () => {
    const moderation = new ModerationController(() => '2026-07-25T12:00:00.000Z')
    moderation.submit({ id: 'report', targetId: 'thread', reason: 'Review' })
    moderation.addNote('report', 'mod', 'Waiting for context')
    moderation.proposeAction('action-1', {
      reportId: 'report',
      actorId: 'mod',
      action: 'remove',
      reason: 'Confirmed violation',
    })
    expect(moderation.snapshot.reports[0].status).toBe('open')
    expect(moderation.snapshot.pendingActions).toHaveLength(1)
    moderation.confirmAction('action-1')
    expect(moderation.snapshot).toMatchObject({
      reports: [expect.objectContaining({ status: 'resolved' })],
      pendingActions: [],
      notes: {
        report: [
          {
            actorId: 'mod',
            text: 'Waiting for context',
            timestamp: '2026-07-25T12:00:00.000Z',
          },
        ],
      },
    })
  })

  it('rechecks moderation authorization at confirmation time', () => {
    let allowed = true
    const moderation = new ModerationController(
      () => '2026-07-25T12:00:00.000Z',
      { authorize: () => allowed },
    )
    moderation.submit({ id: 'report', targetId: 'thread', reason: 'Review' })
    moderation.proposeAction('action-1', {
      reportId: 'report',
      actorId: 'mod',
      action: 'remove',
      reason: 'Confirmed violation',
    })
    allowed = false
    expect(() => moderation.confirmAction('action-1')).toThrow('authorization revoked')
    expect(moderation.snapshot).toMatchObject({
      reports: [expect.objectContaining({ status: 'open' })],
      pendingActions: [expect.objectContaining({ id: 'action-1' })],
    })
  })
})

describe('community authorization and automod', () => {
  it('enforces role permissions and immediate scope revocation', () => {
    const authorization = new CommunityAuthorizationController()
    authorization.setRole('sam', 'moderator')
    expect(authorization.can('sam', 'moderate', 'space-1')).toBe(true)
    authorization.revoke('sam', 'space-1')
    expect(authorization.can('sam', 'moderate', 'space-1')).toBe(false)
    expect(() => authorization.require('sam', 'moderate', 'space-1')).toThrow('authorization')
    authorization.restore('sam', 'space-1')
    expect(authorization.can('sam', 'moderate', 'space-1')).toBe(true)
  })

  it('returns explainable blocked-term, link, and rate-limit decisions', () => {
    let now = 1_000
    const automod = new AutomodController(() => now)
    automod.savePolicy({
      id: 'term',
      kind: 'blocked-term',
      value: 'scam',
      action: 'reject',
      explanation: 'Known scam phrase',
      enabled: true,
    })
    automod.savePolicy({
      id: 'rate',
      kind: 'rate-limit',
      value: 1,
      action: 'flag',
      explanation: 'More than one post per minute',
      enabled: true,
    })
    expect(automod.evaluate({ actorId: 'alex', text: 'A scam offer' })).toEqual({
      allowed: false,
      action: 'reject',
      matchedPolicyIds: ['term'],
      explanations: ['Known scam phrase'],
    })
    now += 1
    expect(automod.evaluate({ actorId: 'alex', text: 'Second post' })).toMatchObject({
      allowed: true,
      action: 'flag',
      matchedPolicyIds: ['rate'],
    })
  })
})

describe('PrivacyController', () => {
  it('tracks block, mute, export, deletion, and cancellation lifecycles', () => {
    const privacy = new PrivacyController()
    privacy.block('blocked')
    privacy.mute('muted')
    privacy.requestExport()
    privacy.exportReady()
    privacy.requestDeletion()
    privacy.scheduleDeletion()
    privacy.cancelDeletion()

    expect(privacy.snapshot).toEqual({
      blocked: ['blocked'],
      muted: ['muted'],
      exportStatus: 'ready',
      deletionStatus: 'cancelled',
    })
  })
})
