import {
  createDurableDraft,
  createMemoryDraftStorage,
  type DraftStorage,
} from '@lastshotlabs/pocketshot/drafts'
import {
  CommunityProfileController,
  SocialGraphController,
  type CommunityProfileVisibility,
} from '@lastshotlabs/pocketshot/community/core'
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
  handle: string | null
  connection: 'online' | 'reconnecting'
  threads: CommunityThread[]
  replies: CommunityReply[]
  selectedThreadId: string | null
  draftTitle: string
  searchResults: string[]
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
  exportStatus: 'idle' | 'requested' | 'ready'
  notice: string | null
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
  notice: null,
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

  reply(body: string): void {
    const threadId = this.stateValue.selectedThreadId
    if (!threadId || !body.trim()) return
    this.replyId += 1
    this.event({
      kind: 'reply',
      reply: { id: `reply-${this.replyId}`, threadId, body, author: 'Alex' },
    })
  }

  react(threadId: string): void {
    if (this.reacted.has(threadId)) return
    this.reacted.add(threadId)
    this.event({ kind: 'reaction', threadId })
  }

  search(query: string): void {
    const normalized = query.trim().toLowerCase()
    this.stateValue.searchResults = normalized
      ? this.stateValue.threads
          .filter(
            (thread) =>
              thread.title.toLowerCase().includes(normalized) ||
              thread.body.toLowerCase().includes(normalized),
          )
          .map((thread) => thread.id)
      : []
    this.emit()
  }

  notify(text: string, targetId: string | null = null): void {
    this.event({
      kind: 'notification',
      id: `notification-${this.cursor + 1}`,
      text,
      targetId,
    })
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

  requestExport(): void {
    this.stateValue.exportStatus = 'requested'
    this.emit()
    queueMicrotask(() => {
      this.stateValue.exportStatus = 'ready'
      this.emit()
    })
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
