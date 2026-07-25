import {
  createDurableDraft,
  createMemoryDraftStorage,
  type DraftStorage,
} from '@lastshotlabs/pocketshot/drafts'
import { RealtimeReconciler, type RealtimeEvent } from '@lastshotlabs/pocketshot/realtime'
import { z } from 'zod'

export interface CommunityThread {
  id: string
  title: string
  body: string
  author: string
  reactions: number
  replyCount: number
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
  | 'privacy'

export interface CommunityState {
  view: CommunityView
  connection: 'online' | 'reconnecting'
  threads: CommunityThread[]
  replies: CommunityReply[]
  selectedThreadId: string | null
  draftTitle: string
  searchResults: string[]
  unread: number
  notifications: { id: string; text: string; read: boolean }[]
  messages: CommunityMessage[]
  messageAccess: 'allowed' | 'revoked'
  reports: CommunityReport[]
  blockedUsers: string[]
  exportStatus: 'idle' | 'requested' | 'ready'
  notice: string | null
}

type Event =
  | { kind: 'thread'; thread: CommunityThread }
  | { kind: 'reply'; reply: CommunityReply }
  | { kind: 'reaction'; threadId: string }
  | { kind: 'notification'; id: string; text: string }
  | { kind: 'message'; message: CommunityMessage }

const initial: CommunityState = {
  view: 'feed',
  connection: 'online',
  threads: [
    {
      id: 'thread-welcome',
      title: 'Welcome to Trail Talk',
      body: 'Share a favorite route.',
      author: 'Morgan',
      reactions: 2,
      replyCount: 0,
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
  reports: [],
  blockedUsers: [],
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
  private listeners = new Set<(state: CommunityState) => void>()
  private realtime = new RealtimeReconciler<Event, CommunityState>((state, event) =>
    reduceCommunity(state, event.payload),
  )

  readonly composer

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
    }
    this.event({ kind: 'thread', thread })
    await this.composer.update(() => ({ title: '', body: '' }))
    this.stateValue.draftTitle = ''
    this.stateValue.selectedThreadId = thread.id
    this.stateValue.view = 'thread'
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

  notify(text: string): void {
    this.event({ kind: 'notification', id: `notification-${this.cursor + 1}`, text })
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
      message: { id: `message-${this.messageId}`, body, mine: true },
    })
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
      notifications: [{ id: event.id, text: event.text, read: false }, ...state.notifications],
    }
  }
  return { ...state, messages: [...state.messages, event.message] }
}
