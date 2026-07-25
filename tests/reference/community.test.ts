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

  it('moves a report through the moderator audit lifecycle', () => {
    const community = new CommunityDemoController()
    community.report('thread-welcome', 'Needs review')
    const report = community.state.reports[0]
    expect(report.status).toBe('open')
    community.resolveReport(report.id, 'warn')
    expect(community.state.reports[0]).toMatchObject({ status: 'resolved', action: 'warn' })
  })

  it('applies privacy controls and completes an export request', async () => {
    const community = new CommunityDemoController()
    const listener = vi.fn()
    community.subscribe(listener)
    community.block('morgan')
    community.block('morgan')
    community.requestExport()
    await Promise.resolve()
    expect(community.state.blockedUsers).toEqual(['morgan'])
    expect(community.state.exportStatus).toBe('ready')
    expect(listener).toHaveBeenCalled()
  })

  it('recovers its visible connection state after reconnect', async () => {
    const community = new CommunityDemoController()
    community.reconnect()
    expect(community.state.connection).toBe('reconnecting')
    await Promise.resolve()
    expect(community.state.connection).toBe('online')
  })
})
