import { describe, expect, it, vi } from 'vitest'
import { CommunityDemoController } from '../../examples/community/lib/community'

describe('Community reference shell', () => {
  it('composes registration, verification, OAuth, session restore, and logout', async () => {
    const registered = new CommunityDemoController()
    await registered.registerAccount()
    expect(registered.state).toMatchObject({
      accountStatus: 'verification-required',
      accountEmail: 'alex@example.com',
    })
    await registered.verifyAccount()
    expect(registered.state).toMatchObject({
      accountStatus: 'authenticated',
      onboarded: true,
      handle: 'alex',
    })
    await registered.signOutAccount()
    expect(registered.state.accountStatus).toBe('anonymous')

    const oauth = new CommunityDemoController()
    await oauth.signInOAuth('google')
    expect(oauth.state).toMatchObject({
      accountStatus: 'authenticated',
      onboarded: true,
    })
  })

  it('composes profile, avatar, follow, mute, and visibility controls', () => {
    const community = new CommunityDemoController()
    community.completeOnboarding('alex')
    community.updateProfile({
      displayName: 'Alex Rivera',
      biography: 'Trail runner',
      avatarUrl: 'https://cdn.example.test/alex.jpg',
      visibility: 'followers',
    })
    community.follow('morgan')
    community.follow('morgan')
    community.mute('morgan')
    expect(community.state).toMatchObject({
      profile: {
        handle: 'alex',
        displayName: 'Alex Rivera',
        biography: 'Trail runner',
        visibility: 'followers',
      },
      followingUsers: ['morgan'],
      mutedUsers: ['morgan'],
    })
    community.unfollow('morgan')
    community.unmute('morgan')
    expect(community.state).toMatchObject({ followingUsers: [], mutedUsers: [] })
  })

  it('completes onboarding with a durable community identity', () => {
    const community = new CommunityDemoController()
    community.completeOnboarding('@alex')
    expect(community.state).toMatchObject({ onboarded: true, handle: 'alex' })
  })

  it('persists and publishes a composed thread', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Best trail?', 'Looking for local ideas.')
    expect(community.composer.snapshot.value.title).toBe('Best trail?')
    await community.publishDraft()
    expect(community.state.threads[0]).toMatchObject({
      title: 'Best trail?',
      body: 'Looking for local ideas.',
    })
    expect(community.state.view).toBe('thread')
  })

  it('adds replies and applies each reaction once', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Question', 'Body')
    await community.publishDraft()
    const id = community.state.threads[0].id
    community.reply('First reply')
    community.react(id)
    community.react(id)
    expect(community.state.replies).toHaveLength(1)
    expect(community.state.threads[0]).toMatchObject({ replyCount: 1, reactions: 1 })
  })

  it('composes nested replies, reply edits/deletes/reactions, saves, and thread edits', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Question', 'Body')
    await community.publishDraft()
    const threadId = community.state.threads[0].id
    community.reply('Parent')
    const parentId = community.state.replies[0].id
    community.reply('Child', parentId)
    const childId = community.state.replies[1].id
    community.editReply(childId, 'Edited child')
    community.reactToReply(childId)
    community.reactToReply(childId)
    community.setSaved(threadId, true)
    community.editSelectedThread('Edited question', 'Edited body')
    expect(community.state.savedThreadIds).toEqual([threadId])
    expect(community.state.threads[0]).toMatchObject({
      title: 'Edited question',
      replyCount: 2,
    })
    expect(community.state.replies).toEqual([
      expect.objectContaining({ id: parentId, parentId: null }),
      expect.objectContaining({
        id: childId,
        parentId,
        body: 'Edited child',
        reactions: 1,
      }),
    ])
    community.deleteReply(parentId)
    expect(community.state.replies[0]).toMatchObject({ deleted: true, body: '' })
  })

  it('deletes an authored thread and its replies and saved state', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Question', 'Body')
    await community.publishDraft()
    const threadId = community.state.threads[0].id
    community.reply('Answer')
    community.setSaved(threadId, true)
    community.deleteSelectedThread()
    expect(community.state).toMatchObject({
      view: 'feed',
      selectedThreadId: null,
      savedThreadIds: [],
      replies: [],
    })
    expect(community.state.threads.some((thread) => thread.id === threadId)).toBe(false)
  })

  it('searches threads and reconciles unread notifications', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Rainy route', 'Try this in wet weather')
    await community.publishDraft()
    community.search('rainy')
    community.notify('Someone replied')
    expect(community.state.searchResults).toEqual([community.state.threads[0].id])
    expect(community.state.unread).toBe(1)
    community.readAll()
    expect(community.state.unread).toBe(0)
    expect(community.state.notifications[0].read).toBe(true)
  })

  it('searches reply, user, and community directory content', async () => {
    const community = new CommunityDemoController()
    community.openThread('thread-welcome')
    community.reply('Morgan recommends the ridge')
    community.search('morgan')
    expect(community.state.searchResults).toEqual(
      expect.arrayContaining(['reply:reply-1', 'directory:Morgan']),
    )
    community.search('trail')
    expect(community.state.searchResults).toEqual(
      expect.arrayContaining(['thread-welcome', 'directory:Trail Talk']),
    )
  })

  it('paginates a deterministically ranked feed without duplicates and preserves its anchor', () => {
    const community = new CommunityDemoController()
    community.anchorFeed('thread-welcome')
    community.loadMoreFeed()
    community.loadMoreFeed()
    expect(community.state.threads.map((thread) => thread.id)).toEqual([
      'thread-welcome',
      'thread-rain',
    ])
    expect(community.state).toMatchObject({
      feedNextCursor: null,
      feedStale: false,
      feedAnchorId: 'thread-welcome',
    })
    community.refreshFeed()
    expect(community.state.feedAnchorId).toBe('thread-welcome')
  })

  it('publishes attachments, mentions, and a single-vote poll', async () => {
    const community = new CommunityDemoController()
    await community.updateDraft('Choose a trail', 'Vote below')
    await community.publishDraft()
    const id = community.state.threads[0].id
    community.enrichLatestThread({
      attachments: ['trail.jpg'],
      mentions: ['morgan'],
      pollOptions: ['River', 'Hill'],
    })
    community.vote(id, 'option-1')
    community.vote(id, 'option-2')
    expect(community.state.threads[0]).toMatchObject({
      attachments: ['trail.jpg'],
      mentions: ['morgan'],
      poll: {
        votedOptionId: 'option-1',
        options: [
          expect.objectContaining({ id: 'option-1', votes: 1 }),
          expect.objectContaining({ id: 'option-2', votes: 0 }),
        ],
      },
    })
  })

  it('opens a notification deep link at its thread and reconciles unread state', () => {
    const community = new CommunityDemoController()
    community.notify('New reply', 'thread-welcome')
    const notification = community.state.notifications[0]
    community.openNotification(notification.id)
    expect(community.state).toMatchObject({
      view: 'thread',
      selectedThreadId: 'thread-welcome',
      unread: 0,
    })
  })

  it('honors notification categories and safely routes push handoffs', () => {
    const community = new CommunityDemoController()
    community.setNotificationPreference('reply', false)
    community.notify('Muted reply', 'thread-welcome', 'reply')
    community.notify('Important mention', 'thread-welcome', 'mention')
    expect(community.state.notifications.map((item) => item.text)).toEqual(['Important mention'])
    expect(community.openPushHandoff('/threads/thread-welcome?source=push')).toBe(true)
    expect(community.state).toMatchObject({
      view: 'thread',
      selectedThreadId: 'thread-welcome',
      pushHandoffRoute: '/threads/thread-welcome?source=push',
    })
    expect(community.openPushHandoff('/account/export')).toBe(false)
    expect(community.openPushHandoff('https://attacker.invalid/account')).toBe(false)
    expect(community.openPushHandoff('https://attacker.invalid/threads/thread-welcome')).toBe(false)
    expect(community.openPushHandoff('sgforum://threads/thread-welcome')).toBe(true)
  })

  it('creates rooms and reconciles unread room messages on open', () => {
    const community = new CommunityDemoController()
    community.createRoom('ridge-crew', 'Ridge Crew', ['alex', 'morgan', 'alex'])
    community.receiveRoomMessage('ridge-crew', 1)
    expect(community.state.rooms).toContainEqual({
      id: 'ridge-crew',
      name: 'Ridge Crew',
      memberIds: ['alex', 'morgan'],
      unread: 1,
    })
    community.openRoom('ridge-crew')
    expect(community.state).toMatchObject({ activeRoomId: 'ridge-crew' })
    expect(community.state.rooms.find((room) => room.id === 'ridge-crew')?.unread).toBe(0)
  })

  it('performs privileged admin changes with a visible audit trail', () => {
    const community = new CommunityDemoController()
    const baseline = community.state.adminAuditCount
    community.setAdminFlag('slow-mode', true)
    community.publishAdminBroadcast('Please review the community rules.')
    community.banUser('reported-user', 'Repeated harassment')
    expect(community.state.adminFlags).toEqual({ 'slow-mode': true })
    expect(community.state.adminAuditCount).toBe(baseline + 3)
    expect(community.admin.snapshot).toMatchObject({
      bans: { 'reported-user': { reason: 'Repeated harassment', expiresAt: null } },
      broadcasts: [expect.objectContaining({ body: 'Please review the community rules.' })],
    })
  })

  it('stops message sends when membership is revoked', () => {
    const community = new CommunityDemoController()
    community.sendMessage('Before')
    community.revokeMessageAccess()
    community.sendMessage('After')
    expect(community.state.messages.map((message) => message.body)).toEqual(['Before'])
    expect(community.state.notice).toContain('no longer have access')
  })

  it('tracks presence, typing, and message read state', () => {
    const community = new CommunityDemoController()
    community.setPresence('offline')
    community.setTyping(true)
    community.sendMessage('Hello')
    community.markMessagesRead()
    expect(community.state).toMatchObject({
      presence: 'offline',
      typing: true,
      messages: [expect.objectContaining({ read: true })],
    })
  })

  it('sends attachment-only messages and enforces automod and scoped authorization', () => {
    const community = new CommunityDemoController()
    community.sendMessage('', [
      {
        id: 'photo-1',
        url: 'https://cdn.example.test/trail.jpg',
        mediaType: 'image/jpeg',
      },
    ])
    community.sendMessage('This message contains harass language')
    expect(community.state.messages).toEqual([
      expect.objectContaining({
        status: 'sent',
        attachments: [expect.objectContaining({ id: 'photo-1' })],
      }),
    ])
    expect(community.state.automodNotice).toContain('Harassment')
    community.revokeMessageAccess()
    expect(() =>
      community.messaging.send({
        id: 'blocked',
        clientId: 'blocked',
        body: 'No access',
      }),
    ).toThrow('revoked')
  })

  it('moves a report through the moderator audit lifecycle', () => {
    const community = new CommunityDemoController()
    community.report('thread-welcome', 'Needs review')
    const report = community.state.reports[0]
    expect(report.status).toBe('open')
    community.resolveReport(report.id, 'warn')
    expect(community.state.reports[0]).toMatchObject({
      status: 'resolved',
      action: 'warn',
      assigneeId: 'alex',
      noteCount: 1,
    })
    expect(community.state.moderationAuditCount).toBe(2)
  })

  it('applies privacy controls and completes an export request', async () => {
    const community = new CommunityDemoController()
    const listener = vi.fn()
    community.subscribe(listener)
    community.block('morgan')
    community.block('morgan')
    await community.requestExport()
    expect(community.state.exportStatus).toBe('requested')
    await community.refreshExport()
    expect(community.state.blockedUsers).toEqual(['morgan'])
    expect(community.state.exportStatus).toBe('ready')
    expect(listener).toHaveBeenCalled()
  })

  it('cancels and completes account deletion with authorization revocation and cleanup', async () => {
    const community = new CommunityDemoController()
    await community.signInOAuth('apple')
    community.sendMessage('private message')
    community.notify('private notification')
    await community.requestDeletion()
    expect(community.state.deletionStatus).toBe('scheduled')
    await community.cancelDeletion()
    expect(community.state).toMatchObject({
      deletionStatus: 'cancelled',
      accountStatus: 'authenticated',
    })
    await community.requestDeletion()
    await community.completeDeletion()
    expect(community.state).toMatchObject({
      deletionStatus: 'completed',
      localDataCleared: true,
      accountStatus: 'anonymous',
      onboarded: false,
      messages: [],
      notifications: [],
    })
  })

  it('recovers its visible connection state after reconnect', async () => {
    const community = new CommunityDemoController()
    community.reconnect()
    expect(community.state.connection).toBe('reconnecting')
    await Promise.resolve()
    expect(community.state.connection).toBe('online')
  })
})
