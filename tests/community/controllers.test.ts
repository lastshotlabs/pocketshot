import { describe, expect, it } from 'vitest'
import {
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
