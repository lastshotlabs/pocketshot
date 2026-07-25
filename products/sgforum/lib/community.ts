import {
  createDurableDraft,
  createMemoryDraftStorage,
  type DraftStorage,
} from '@lastshotlabs/pocketshot/drafts'
import {
  CommunityAdminController,
  CommunityProfileController,
  RoomStateController,
  SocialGraphController,
  type CommunityProfileVisibility,
} from '@lastshotlabs/pocketshot/community/core'
import {
  AccountAuthController,
  type AccountAuthTransport,
  type TokenStorage,
} from '@lastshotlabs/pocketshot/auth'
import {
  AccountDataController,
  type DeletionStatus,
  type ExportStatus,
} from '@lastshotlabs/pocketshot/privacy'
import { RealtimeReconciler, type RealtimeEvent } from '@lastshotlabs/pocketshot/realtime'
import { z } from 'zod'

export interface CommunityThread {
  id: string
  title: string
  body: string
  author: string
  reactions: number
  replyCount: number
  attachments: string[]
  mentions: string[]
  poll: {
    options: { id: string; label: string; votes: number }[]
    votedOptionId: string | null
  } | null
}

export interface CommunityReply {
  id: string
  threadId: string
  body: string
  author: string
  parentId: string | null
  reactions: number
  deleted: boolean
}

export interface CommunityMessage {
  id: string
  body: string
  mine: boolean
  read: boolean
}

export interface CommunityReport {
  id: string
  targetId: string
  reason: string
  status: 'open' | 'resolved'
  action?: string
}

export type CommunityView =
  | 'feed'
  | 'compose'
  | 'thread'
  | 'notifications'
  | 'messages'
  | 'moderation'
  | 'profile'
  | 'privacy'

export interface CommunityState {
  view: CommunityView
  onboarded: boolean
  accountStatus: 'anonymous' | 'verification-required' | 'authenticated'
  accountEmail: string | null
  handle: string | null
  connection: 'online' | 'reconnecting'
  threads: CommunityThread[]
  replies: CommunityReply[]
  selectedThreadId: string | null
  draftTitle: string
  searchResults: string[]
  savedThreadIds: string[]
  unread: number
  notifications: { id: string; text: string; read: boolean; targetId: string | null }[]
  messages: CommunityMessage[]
  messageAccess: 'allowed' | 'revoked'
  presence: 'online' | 'offline'
  typing: boolean
  reports: CommunityReport[]
  blockedUsers: string[]
  profile: {
    handle: string
    displayName: string
    biography: string
    avatarUrl: string | null
    visibility: CommunityProfileVisibility
  } | null
  followingUsers: string[]
  mutedUsers: string[]
  exportStatus: ExportStatus
  deletionStatus: DeletionStatus
  localDataCleared: boolean
  notice: string | null
  notificationPreferences: Record<'reply' | 'mention' | 'message' | 'moderation', boolean>
  pushHandoffRoute: string | null
  rooms: { id: string; name: string; memberIds: string[]; unread: number }[]
  activeRoomId: string | null
  adminFlags: Record<string, boolean>
  adminAuditCount: number
}

type Event =
  | { kind: 'thread'; thread: CommunityThread }
  | { kind: 'reply'; reply: CommunityReply }
  | { kind: 'reaction'; threadId: string }
  | { kind: 'notification'; id: string; text: string; targetId: string | null }
  | { kind: 'message'; message: CommunityMessage }

const initial: CommunityState = {
  view: 'feed',
  onboarded: false,
  accountStatus: 'anonymous',
  accountEmail: null,
  handle: null,
  connection: 'online',
  threads: [
    {
      id: 'thread-welcome',
      title: 'Welcome to Trail Talk',
      body: 'Share a favorite route.',
      author: 'Morgan',
      reactions: 2,
      replyCount: 0,
      attachments: [],
      mentions: [],
      poll: null,
    },
  ],
  replies: [],
  selectedThreadId: null,
  draftTitle: '',
  searchResults: [],
  savedThreadIds: [],
  unread: 0,
  notifications: [],
  messages: [],
  messageAccess: 'allowed',
  presence: 'online',
  typing: false,
  reports: [],
  blockedUsers: [],
  profile: null,
  followingUsers: [],
  mutedUsers: [],
  exportStatus: 'idle',
  deletionStatus: 'idle',
  localDataCleared: false,
  notice: null,
  notificationPreferences: { reply: true, mention: true, message: true, moderation: true },
  pushHandoffRoute: null,
  rooms: [{ id: 'trail-room', name: 'Trail Room', memberIds: ['alex', 'morgan'], unread: 0 }],
  activeRoomId: null,
  adminFlags: {},
  adminAuditCount: 0,
}

export class CommunityDemoController {
  private stateValue: CommunityState = structuredClone(initial)
  private cursor = 0
  private threadId = 0
  private replyId = 0
  private messageId = 0
  private reportId = 0
  private reacted = new Set<string>()
  private muted = new Set<string>()
  private listeners = new Set<(state: CommunityState) => void>()
  private realtime = new RealtimeReconciler<Event, CommunityState>((state, event) =>
    reduceCommunity(state, event.payload),
  )

  readonly composer
  readonly profiles = new CommunityProfileController()
  readonly social = new SocialGraphController()
  readonly rooms = new RoomStateController()
  readonly admin = new CommunityAdminController(() => '2026-07-25T12:00:00.000Z')
  readonly account = createCommunityAccount()
  readonly accountData = new AccountDataController(
    {
      requestExport: async () => ({ requestId: 'community-export-1' }),
      getExport: async () => ({
        status: 'ready',
        downloadUrl: 'https://downloads.example.test/community-export.zip',
      }),
      requestDeletion: async () => ({
        requestId: 'community-deletion-1',
        scheduledAt: '2026-08-01T12:00:00.000Z',
      }),
      cancelDeletion: async () => undefined,
      getDeletion: async () => ({ status: 'completed' }),
      revokeAuthorization: async () => this.account.logout(),
    },
    [
      {
        name: 'community-messages',
        clear: () => {
          this.stateValue.messages = []
          this.stateValue.notifications = []
          this.stateValue.unread = 0
        },
      },
      {
        name: 'community-drafts-and-profile',
        clear: () => {
          this.stateValue.draftTitle = ''
          this.stateValue.profile = null
          this.stateValue.onboarded = false
          this.stateValue.handle = null
        },
      },
    ],
  )

  constructor(storage: DraftStorage = createMemoryDraftStorage()) {
    this.composer = createDurableDraft({
      id: 'community-compose',
      initialValue: { title: '', body: '' },
      storage,
      saveRemote: async ({ value }) => ({ value, version: 'community-demo-1' }),
      publishSchema: z.object({
        title: z.string().trim().min(1),
        body: z.string().trim().min(1),
      }),
    })
    this.realtime.applySnapshot({
      version: 1,
      channel: 'community-demo',
      cursor: 0,
      state: this.stateValue,
    })
    this.rooms.openRoom('trail-room')
    for (const ability of ['ban', 'broadcast', 'manage_flags', 'view_audit'] as const) {
      this.admin.grant('system', 'alex', ability)
    }
    const admin = this.admin.snapshot
    this.stateValue.adminFlags = admin.flags
    this.stateValue.adminAuditCount = admin.audit.length
  }

  get state(): CommunityState {
    return structuredClone(this.stateValue)
  }

  subscribe(listener: (state: CommunityState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  navigate(view: CommunityView): void {
    this.stateValue.view = view
    this.stateValue.notice = null
    this.emit()
  }

  completeOnboarding(handle: string): void {
    const normalized = handle.trim().replace(/^@/, '')
    if (!normalized) {
      this.stateValue.notice = 'Choose a handle to continue.'
      this.emit()
      return
    }
    this.stateValue.handle = normalized
    this.profiles.save({
      userId: 'alex',
      handle: normalized,
      displayName: 'Alex',
      biography: '',
      avatarUrl: null,
      visibility: 'public',
    })
    this.syncProfile()
    this.stateValue.onboarded = true
    this.emit()
  }

  async registerAccount(): Promise<void> {
    await this.account.register({
      email: 'alex@example.com',
      password: 'community-password',
      displayName: 'Alex',
    })
    this.syncAccount()
  }

  async verifyAccount(): Promise<void> {
    await this.account.verifyEmail('123456')
    this.syncAccount()
    this.completeOnboarding('alex')
  }

  async signInOAuth(provider: 'apple' | 'google'): Promise<void> {
    await this.account.completeOAuth(
      provider,
      'demo-code',
      `pocketshot-community://oauth/${provider}`,
    )
    this.syncAccount()
    this.completeOnboarding('alex')
  }

  async restoreAccount(): Promise<void> {
    await this.account.restore()
    this.syncAccount()
  }

  async signOutAccount(): Promise<void> {
    await this.account.logout()
    this.syncAccount()
  }

  updateProfile(input: {
    displayName: string
    biography: string
    avatarUrl: string | null
    visibility: CommunityProfileVisibility
  }): void {
    const handle = this.stateValue.handle
    if (!handle) throw new Error('Complete onboarding before editing a profile')
    this.profiles.save({ userId: 'alex', handle, ...input })
    this.syncProfile()
    this.emit()
  }

  follow(userId: string): void {
    this.social.follow(userId)
    this.stateValue.followingUsers = this.social.snapshot.following
    this.emit()
  }

  unfollow(userId: string): void {
    this.social.unfollow(userId)
    this.stateValue.followingUsers = this.social.snapshot.following
    this.emit()
  }

  mute(userId: string): void {
    this.muted.add(userId)
    this.stateValue.mutedUsers = [...this.muted].sort()
    this.emit()
  }

  unmute(userId: string): void {
    this.muted.delete(userId)
    this.stateValue.mutedUsers = [...this.muted].sort()
    this.emit()
  }

  async updateDraft(title: string, body: string): Promise<void> {
    await this.composer.update(() => ({ title, body }))
    this.stateValue.draftTitle = title
    this.emit()
  }

  async publishDraft(): Promise<void> {
    if (!this.composer.snapshot.canPublish) {
      this.stateValue.notice = 'Add a title and body before publishing.'
      this.emit()
      return
    }
    await this.composer.flush()
    this.threadId += 1
    const value = this.composer.snapshot.value
    const thread: CommunityThread = {
      id: `thread-${this.threadId}`,
      title: value.title,
      body: value.body,
      author: 'Alex',
      reactions: 0,
      replyCount: 0,
      attachments: [],
      mentions: [],
      poll: null,
    }
    this.event({ kind: 'thread', thread })
    await this.composer.update(() => ({ title: '', body: '' }))
    this.stateValue.draftTitle = ''
    this.stateValue.selectedThreadId = thread.id
    this.stateValue.view = 'thread'
    this.emit()
  }

  enrichLatestThread(input: {
    attachments?: string[]
    mentions?: string[]
    pollOptions?: string[]
  }): void {
    const thread = this.stateValue.threads[0]
    if (!thread) return
    const labels = input.pollOptions?.filter((label) => label.trim()) ?? []
    this.stateValue.threads[0] = {
      ...thread,
      attachments: [...(input.attachments ?? [])],
      mentions: [...(input.mentions ?? [])],
      poll:
        labels.length >= 2
          ? {
              options: labels.map((label, index) => ({
                id: `option-${index + 1}`,
                label,
                votes: 0,
              })),
              votedOptionId: null,
            }
          : null,
    }
    this.emit()
  }

  vote(threadId: string, optionId: string): void {
    this.stateValue.threads = this.stateValue.threads.map((thread) => {
      if (thread.id !== threadId || !thread.poll || thread.poll.votedOptionId) return thread
      if (!thread.poll.options.some((option) => option.id === optionId)) return thread
      return {
        ...thread,
        poll: {
          votedOptionId: optionId,
          options: thread.poll.options.map((option) =>
            option.id === optionId ? { ...option, votes: option.votes + 1 } : option,
          ),
        },
      }
    })
    this.emit()
  }

  openThread(id: string): void {
    this.stateValue.selectedThreadId = id
    this.stateValue.view = 'thread'
    this.emit()
  }

  reply(body: string, parentId: string | null = null): void {
    const threadId = this.stateValue.selectedThreadId
    if (!threadId || !body.trim()) return
    if (
      parentId &&
      !this.stateValue.replies.some(
        (reply) => reply.id === parentId && reply.threadId === threadId && !reply.deleted,
      )
    ) {
      throw new Error('Nested reply parent must belong to the selected thread')
    }
    this.replyId += 1
    this.event({
      kind: 'reply',
      reply: {
        id: `reply-${this.replyId}`,
        threadId,
        body,
        author: 'Alex',
        parentId,
        reactions: 0,
        deleted: false,
      },
    })
  }

  editSelectedThread(title: string, body: string): void {
    const id = this.stateValue.selectedThreadId
    if (!id || !title.trim() || !body.trim()) return
    this.stateValue.threads = this.stateValue.threads.map((thread) =>
      thread.id === id ? { ...thread, title: title.trim(), body: body.trim() } : thread,
    )
    this.emit()
  }

  deleteSelectedThread(): void {
    const id = this.stateValue.selectedThreadId
    if (!id) return
    this.stateValue.threads = this.stateValue.threads.filter((thread) => thread.id !== id)
    this.stateValue.replies = this.stateValue.replies.filter((reply) => reply.threadId !== id)
    this.stateValue.savedThreadIds = this.stateValue.savedThreadIds.filter(
      (threadId) => threadId !== id,
    )
    this.stateValue.selectedThreadId = null
    this.stateValue.view = 'feed'
    this.emit()
  }

  editReply(id: string, body: string): void {
    if (!body.trim()) return
    this.stateValue.replies = this.stateValue.replies.map((reply) =>
      reply.id === id && !reply.deleted ? { ...reply, body: body.trim() } : reply,
    )
    this.emit()
  }

  deleteReply(id: string): void {
    this.stateValue.replies = this.stateValue.replies.map((reply) =>
      reply.id === id ? { ...reply, body: '', deleted: true } : reply,
    )
    this.emit()
  }

  reactToReply(id: string): void {
    const key = `reply:${id}`
    if (this.reacted.has(key)) return
    this.reacted.add(key)
    this.stateValue.replies = this.stateValue.replies.map((reply) =>
      reply.id === id && !reply.deleted ? { ...reply, reactions: reply.reactions + 1 } : reply,
    )
    this.emit()
  }

  setSaved(threadId: string, saved: boolean): void {
    const values = new Set(this.stateValue.savedThreadIds)
    if (saved) values.add(threadId)
    else values.delete(threadId)
    this.stateValue.savedThreadIds = [...values].sort()
    this.emit()
  }

  react(threadId: string): void {
    if (this.reacted.has(threadId)) return
    this.reacted.add(threadId)
    this.event({ kind: 'reaction', threadId })
  }

  search(query: string): void {
    const normalized = query.trim().toLowerCase()
    this.stateValue.searchResults = normalized
      ? [
          ...this.stateValue.threads
            .filter(
              (thread) =>
                thread.title.toLowerCase().includes(normalized) ||
                thread.body.toLowerCase().includes(normalized) ||
                thread.author.toLowerCase().includes(normalized),
            )
            .map((thread) => thread.id),
          ...this.stateValue.replies
            .filter(
              (reply) =>
                !reply.deleted &&
                (reply.body.toLowerCase().includes(normalized) ||
                  reply.author.toLowerCase().includes(normalized)),
            )
            .map((reply) => `reply:${reply.id}`),
          ...['Trail Talk', 'Alex', 'Morgan']
            .filter((value) => value.toLowerCase().includes(normalized))
            .map((value) => `directory:${value}`),
        ]
      : []
    this.emit()
  }

  notify(
    text: string,
    targetId: string | null = null,
    category: keyof CommunityState['notificationPreferences'] = 'reply',
  ): void {
    if (!this.stateValue.notificationPreferences[category]) return
    this.event({
      kind: 'notification',
      id: `notification-${this.cursor + 1}`,
      text,
      targetId,
    })
  }

  setNotificationPreference(
    category: keyof CommunityState['notificationPreferences'],
    enabled: boolean,
  ): void {
    this.stateValue.notificationPreferences[category] = enabled
    this.emit()
  }

  openPushHandoff(route: string): boolean {
    let url: URL
    try {
      url = new URL(route, 'https://links.sgforum.app')
    } catch {
      return false
    }
    const isRelative = route.startsWith('/')
    const isUniversalLink = url.protocol === 'https:' && url.hostname === 'links.sgforum.app'
    const isCustomScheme = url.protocol === 'sgforum:'
    if (!isRelative && !isUniversalLink && !isCustomScheme) return false
    const pathname =
      isCustomScheme && url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname
    const normalized = `${pathname}${url.search}${url.hash}`
    if (!/^\/(?:threads|messages|rooms|moderation)(?:\/|$)/.test(normalized)) return false
    this.stateValue.pushHandoffRoute = normalized
    const thread = /^\/threads\/([^/#?]+)/.exec(normalized)?.[1]
    if (thread && this.stateValue.threads.some((candidate) => candidate.id === thread)) {
      this.openThread(thread)
    } else {
      this.emit()
    }
    return true
  }

  createRoom(id: string, name: string, memberIds: string[]): void {
    if (!id.trim() || !name.trim() || memberIds.length < 2) {
      throw new Error('Room requires an id, name, and at least two members')
    }
    if (this.stateValue.rooms.some((room) => room.id === id)) return
    this.rooms.openRoom(id)
    this.stateValue.rooms.push({
      id,
      name: name.trim(),
      memberIds: [...new Set(memberIds)],
      unread: 0,
    })
    this.emit()
  }

  openRoom(id: string): void {
    const room = this.stateValue.rooms.find((candidate) => candidate.id === id)
    if (!room) throw new Error(`Unknown room: ${id}`)
    this.rooms.openRoom(id)
    this.rooms.markRead(id, this.rooms.snapshot.latestSequence)
    room.unread = 0
    this.stateValue.activeRoomId = id
    this.emit()
  }

  receiveRoomMessage(id: string, sequence: number): void {
    const room = this.stateValue.rooms.find((candidate) => candidate.id === id)
    if (!room) throw new Error(`Unknown room: ${id}`)
    this.rooms.receive(sequence)
    if (this.stateValue.activeRoomId !== id) room.unread += 1
    this.emit()
  }

  setAdminFlag(key: string, enabled: boolean): void {
    this.admin.setFlag('alex', key, enabled, '2026-07-25T11:59:00.000Z')
    this.syncAdmin()
  }

  publishAdminBroadcast(body: string): void {
    this.admin.broadcast(
      'alex',
      `broadcast-${this.admin.snapshot.broadcasts.length + 1}`,
      body,
      '2026-07-25T11:59:00.000Z',
    )
    this.syncAdmin()
  }

  banUser(userId: string, reason: string): void {
    this.admin.ban('alex', userId, reason, '2026-07-25T11:59:00.000Z')
    this.syncAdmin()
  }

  openNotification(id: string): void {
    const notification = this.stateValue.notifications.find((item) => item.id === id)
    if (!notification) return
    this.stateValue.notifications = this.stateValue.notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    )
    this.stateValue.unread = this.stateValue.notifications.filter((item) => !item.read).length
    if (notification.targetId) this.openThread(notification.targetId)
    else {
      this.stateValue.view = 'notifications'
      this.emit()
    }
  }

  readAll(): void {
    this.stateValue.notifications = this.stateValue.notifications.map((item) => ({
      ...item,
      read: true,
    }))
    this.stateValue.unread = 0
    this.emit()
  }

  sendMessage(body: string): void {
    if (this.stateValue.messageAccess === 'revoked') {
      this.stateValue.notice = 'You no longer have access to this conversation.'
      this.emit()
      return
    }
    this.messageId += 1
    this.event({
      kind: 'message',
      message: { id: `message-${this.messageId}`, body, mine: true, read: false },
    })
  }

  setPresence(presence: 'online' | 'offline'): void {
    this.stateValue.presence = presence
    this.emit()
  }

  setTyping(typing: boolean): void {
    this.stateValue.typing = typing
    this.emit()
  }

  markMessagesRead(): void {
    this.stateValue.messages = this.stateValue.messages.map((message) => ({
      ...message,
      read: true,
    }))
    this.emit()
  }

  revokeMessageAccess(): void {
    this.stateValue.messageAccess = 'revoked'
    this.stateValue.notice = 'Conversation access was revoked.'
    this.emit()
  }

  report(targetId: string, reason: string): void {
    this.reportId += 1
    this.stateValue.reports.push({
      id: `report-${this.reportId}`,
      targetId,
      reason,
      status: 'open',
    })
    this.stateValue.view = 'moderation'
    this.emit()
  }

  resolveReport(id: string, action: string): void {
    this.stateValue.reports = this.stateValue.reports.map((report) =>
      report.id === id ? { ...report, status: 'resolved', action } : report,
    )
    this.emit()
  }

  block(userId: string): void {
    if (!this.stateValue.blockedUsers.includes(userId)) {
      this.stateValue.blockedUsers.push(userId)
      this.emit()
    }
  }

  async requestExport(): Promise<void> {
    await this.accountData.requestExport()
    this.syncAccountData()
  }

  async refreshExport(): Promise<void> {
    await this.accountData.refreshExport()
    this.syncAccountData()
  }

  async requestDeletion(): Promise<void> {
    await this.accountData.requestDeletion()
    this.syncAccountData()
  }

  async cancelDeletion(): Promise<void> {
    await this.accountData.cancelDeletion()
    this.syncAccountData()
  }

  async completeDeletion(): Promise<void> {
    await this.accountData.refreshDeletion()
    this.syncAccountData()
    this.syncAccount()
  }

  reconnect(): void {
    this.stateValue.connection = 'reconnecting'
    this.emit()
    queueMicrotask(() => {
      this.stateValue.connection = 'online'
      this.emit()
    })
  }

  private event(payload: Event): void {
    this.cursor += 1
    const event: RealtimeEvent<Event> = {
      version: 1,
      channel: 'community-demo',
      id: `community-event-${this.cursor}`,
      cursor: this.cursor,
      type: payload.kind,
      timestamp: new Date().toISOString(),
      payload,
    }
    const result = this.realtime.push(event)
    if (result.state) this.stateValue = result.state
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }

  private syncProfile(): void {
    const profile = this.profiles.get('alex')
    this.stateValue.profile = profile
      ? {
          handle: profile.handle,
          displayName: profile.displayName,
          biography: profile.biography,
          avatarUrl: profile.avatarUrl,
          visibility: profile.visibility,
        }
      : null
  }

  private syncAccount(): void {
    const snapshot = this.account.snapshot
    this.stateValue.accountStatus =
      snapshot.status === 'authenticated'
        ? 'authenticated'
        : snapshot.status === 'verification-required'
          ? 'verification-required'
          : 'anonymous'
    this.stateValue.accountEmail = snapshot.user?.email ?? snapshot.pendingEmail
    this.emit()
  }

  private syncAccountData(): void {
    const snapshot = this.accountData.snapshot
    this.stateValue.exportStatus = snapshot.exportStatus
    this.stateValue.deletionStatus = snapshot.deletionStatus
    this.stateValue.localDataCleared =
      snapshot.authorizationRevoked && snapshot.clearedStores.length === 2
    this.emit()
  }

  private syncAdmin(): void {
    const snapshot = this.admin.snapshot
    this.stateValue.adminFlags = snapshot.flags
    this.stateValue.adminAuditCount = snapshot.audit.length
    this.emit()
  }
}

function reduceCommunity(state: CommunityState, event: Event): CommunityState {
  if (event.kind === 'thread') return { ...state, threads: [event.thread, ...state.threads] }
  if (event.kind === 'reply') {
    return {
      ...state,
      replies: [...state.replies, event.reply],
      threads: state.threads.map((thread) =>
        thread.id === event.reply.threadId
          ? { ...thread, replyCount: thread.replyCount + 1 }
          : thread,
      ),
    }
  }
  if (event.kind === 'reaction') {
    return {
      ...state,
      threads: state.threads.map((thread) =>
        thread.id === event.threadId ? { ...thread, reactions: thread.reactions + 1 } : thread,
      ),
    }
  }
  if (event.kind === 'notification') {
    return {
      ...state,
      unread: state.unread + 1,
      notifications: [
        { id: event.id, text: event.text, read: false, targetId: event.targetId },
        ...state.notifications,
      ],
    }
  }
  return { ...state, messages: [...state.messages, event.message] }
}

function createCommunityAccount(): AccountAuthController {
  let accessToken: string | null = null
  let refreshToken: string | null = null
  const storage: TokenStorage = {
    getToken: async () => accessToken,
    setToken: async (value) => {
      accessToken = value
    },
    clearToken: async () => {
      accessToken = null
    },
    getRefreshToken: async () => refreshToken,
    setRefreshToken: async (value) => {
      refreshToken = value
    },
    clearRefreshToken: async () => {
      refreshToken = null
    },
  }
  const authenticated = {
    user: {
      id: 'community-user',
      email: 'alex@example.com',
      emailVerified: true,
      displayName: 'Alex',
    },
    accessToken: 'community-access',
    refreshToken: 'community-refresh',
  }
  const transport: AccountAuthTransport = {
    register: async (input) => ({
      user: {
        id: 'community-user',
        email: input.email,
        emailVerified: false,
        displayName: input.displayName,
      },
      verificationRequired: true,
    }),
    verifyEmail: async () => authenticated,
    login: async () => authenticated,
    exchangeOAuth: async () => authenticated,
    restore: async () => authenticated,
    logout: async () => undefined,
    forgotPassword: async () => undefined,
    resetPassword: async () => undefined,
  }
  return new AccountAuthController(transport, storage)
}
