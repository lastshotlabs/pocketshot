export interface CursorEntity {
  id: string
}

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  version: number
}

export interface CursorFeedSnapshot<T> {
  items: T[]
  nextCursor: string | null
  version: number
  isStale: boolean
}

export class CursorFeedController<T extends CursorEntity> {
  private itemsValue: T[] = []
  private nextCursorValue: string | null = null
  private versionValue = 0
  private staleValue = false

  get snapshot(): CursorFeedSnapshot<T> {
    return {
      items: structuredClone(this.itemsValue),
      nextCursor: this.nextCursorValue,
      version: this.versionValue,
      isStale: this.staleValue,
    }
  }

  replace(page: CursorPage<T>): void {
    if (page.version < this.versionValue) return
    this.itemsValue = uniqueById(page.items)
    this.nextCursorValue = page.nextCursor
    this.versionValue = page.version
    this.staleValue = false
  }

  append(page: CursorPage<T>, requestedCursor: string | null): void {
    if (requestedCursor !== this.nextCursorValue || page.version < this.versionValue) {
      this.staleValue = true
      return
    }
    this.itemsValue = uniqueById([...this.itemsValue, ...page.items])
    this.nextCursorValue = page.nextCursor
    this.versionValue = page.version
  }

  upsert(item: T, position: 'start' | 'end' = 'start'): void {
    const remaining = this.itemsValue.filter((candidate) => candidate.id !== item.id)
    this.itemsValue = position === 'start' ? [item, ...remaining] : [...remaining, item]
  }

  remove(id: string): void {
    this.itemsValue = this.itemsValue.filter((item) => item.id !== id)
  }

  markStale(): void {
    this.staleValue = true
  }
}

export interface DiscussionThread {
  id: string
  title: string
  body: string
  reactionCount: number
  replyCount: number
  deleted: boolean
}

export interface DiscussionReply {
  id: string
  threadId: string
  parentId: string | null
  body: string
  reactionCount: number
  deleted: boolean
}

export interface DiscussionPoll {
  threadId: string
  options: Array<{ id: string; label: string; votes: number }>
  selections: Array<{ actorId: string; optionId: string }>
  closed: boolean
}

export class DiscussionController {
  private threads = new Map<string, DiscussionThread>()
  private replies = new Map<string, DiscussionReply>()
  private reactions = new Set<string>()
  private saves = new Set<string>()
  private polls = new Map<string, DiscussionPoll>()

  getThread(id: string): DiscussionThread | null {
    const value = this.threads.get(id)
    return value ? structuredClone(value) : null
  }

  listReplies(threadId: string): DiscussionReply[] {
    return [...this.replies.values()]
      .filter((reply) => reply.threadId === threadId)
      .map((reply) => structuredClone(reply))
  }

  createThread(thread: Omit<DiscussionThread, 'reactionCount' | 'replyCount' | 'deleted'>): void {
    if (this.threads.has(thread.id)) return
    this.threads.set(thread.id, {
      ...structuredClone(thread),
      reactionCount: 0,
      replyCount: 0,
      deleted: false,
    })
  }

  editThread(id: string, patch: Pick<Partial<DiscussionThread>, 'title' | 'body'>): void {
    const thread = this.requireThread(id)
    this.threads.set(id, { ...thread, ...structuredClone(patch) })
  }

  deleteThread(id: string): void {
    const thread = this.requireThread(id)
    this.threads.set(id, { ...thread, title: '', body: '', deleted: true })
  }

  createReply(reply: Omit<DiscussionReply, 'reactionCount' | 'deleted'>): void {
    if (this.replies.has(reply.id)) return
    const thread = this.requireThread(reply.threadId)
    if (reply.parentId) {
      const parent = this.replies.get(reply.parentId)
      if (!parent || parent.threadId !== reply.threadId) {
        throw new Error('Reply parent does not belong to this thread')
      }
    }
    this.replies.set(reply.id, { ...structuredClone(reply), reactionCount: 0, deleted: false })
    this.threads.set(thread.id, { ...thread, replyCount: thread.replyCount + 1 })
  }

  editReply(id: string, body: string): void {
    const reply = this.requireReply(id)
    this.replies.set(id, { ...reply, body })
  }

  deleteReply(id: string): void {
    const reply = this.requireReply(id)
    this.replies.set(id, { ...reply, body: '', deleted: true })
  }

  react(target: 'thread' | 'reply', id: string, emoji: string, actorId: string): void {
    const key = `${target}:${id}:${emoji}:${actorId}`
    if (this.reactions.has(key)) return
    this.reactions.add(key)
    if (target === 'thread') {
      const thread = this.requireThread(id)
      this.threads.set(id, { ...thread, reactionCount: thread.reactionCount + 1 })
    } else {
      const reply = this.requireReply(id)
      this.replies.set(id, { ...reply, reactionCount: reply.reactionCount + 1 })
    }
  }

  unreact(target: 'thread' | 'reply', id: string, emoji: string, actorId: string): void {
    const key = `${target}:${id}:${emoji}:${actorId}`
    if (!this.reactions.delete(key)) return
    if (target === 'thread') {
      const thread = this.requireThread(id)
      this.threads.set(id, { ...thread, reactionCount: Math.max(0, thread.reactionCount - 1) })
    } else {
      const reply = this.requireReply(id)
      this.replies.set(id, { ...reply, reactionCount: Math.max(0, reply.reactionCount - 1) })
    }
  }

  setSaved(threadId: string, actorId: string, saved: boolean): void {
    this.requireThread(threadId)
    const key = `${threadId}:${actorId}`
    if (saved) this.saves.add(key)
    else this.saves.delete(key)
  }

  isSaved(threadId: string, actorId: string): boolean {
    return this.saves.has(`${threadId}:${actorId}`)
  }

  createPoll(threadId: string, options: Array<{ id: string; label: string }>): void {
    this.requireThread(threadId)
    if (this.polls.has(threadId)) throw new Error('Thread already has a poll')
    const valid = options.map((option) => ({ ...option, label: option.label.trim() }))
    if (
      valid.length < 2 ||
      valid.some((option) => !option.id || !option.label) ||
      new Set(valid.map((option) => option.id)).size !== valid.length
    ) {
      throw new Error('Poll requires at least two unique labeled options')
    }
    this.polls.set(threadId, {
      threadId,
      options: valid.map((option) => ({ ...option, votes: 0 })),
      selections: [],
      closed: false,
    })
  }

  votePoll(threadId: string, actorId: string, optionId: string): void {
    const poll = this.requirePoll(threadId)
    if (poll.closed) throw new Error('Poll is closed')
    if (!poll.options.some((option) => option.id === optionId)) {
      throw new Error(`Unknown poll option: ${optionId}`)
    }
    const previous = poll.selections.find((selection) => selection.actorId === actorId)
    if (previous?.optionId === optionId) return
    if (previous) {
      const option = poll.options.find((candidate) => candidate.id === previous.optionId)!
      option.votes = Math.max(0, option.votes - 1)
      previous.optionId = optionId
    } else {
      poll.selections.push({ actorId, optionId })
    }
    poll.options.find((option) => option.id === optionId)!.votes += 1
  }

  closePoll(threadId: string): void {
    this.requirePoll(threadId).closed = true
  }

  getPoll(threadId: string): DiscussionPoll | null {
    const poll = this.polls.get(threadId)
    return poll ? structuredClone(poll) : null
  }

  resolveAnchor(
    threadId: string,
    replyId?: string,
  ): { thread: DiscussionThread; reply: DiscussionReply | null; ancestors: DiscussionReply[] } {
    const thread = structuredClone(this.requireThread(threadId))
    if (!replyId) return { thread, reply: null, ancestors: [] }
    const reply = this.requireReply(replyId)
    if (reply.threadId !== threadId) throw new Error('Reply anchor does not belong to thread')
    const ancestors: DiscussionReply[] = []
    const seen = new Set<string>([reply.id])
    let parentId = reply.parentId
    while (parentId) {
      if (seen.has(parentId)) throw new Error('Reply graph contains a cycle')
      seen.add(parentId)
      const parent = this.requireReply(parentId)
      ancestors.unshift(structuredClone(parent))
      parentId = parent.parentId
    }
    return { thread, reply: structuredClone(reply), ancestors }
  }

  private requireThread(id: string): DiscussionThread {
    const value = this.threads.get(id)
    if (!value) throw new Error(`Unknown thread: ${id}`)
    return value
  }

  private requireReply(id: string): DiscussionReply {
    const value = this.replies.get(id)
    if (!value) throw new Error(`Unknown reply: ${id}`)
    return value
  }

  private requirePoll(threadId: string): DiscussionPoll {
    const value = this.polls.get(threadId)
    if (!value) throw new Error(`Thread has no poll: ${threadId}`)
    return value
  }
}

export interface CommunityNotification {
  id: string
  sequence: number
  category: string
  text: string
  read: boolean
}

export class NotificationInboxController {
  private items = new Map<string, CommunityNotification>()
  private lastSequence = 0
  private preferences = new Map<string, boolean>()

  get snapshot(): { items: CommunityNotification[]; unread: number; lastSequence: number } {
    const items = [...this.items.values()]
      .sort((left, right) => right.sequence - left.sequence)
      .map((item) => structuredClone(item))
    return {
      items,
      unread: items.filter((item) => !item.read).length,
      lastSequence: this.lastSequence,
    }
  }

  receive(item: Omit<CommunityNotification, 'read'>): void {
    if (this.items.has(item.id) || item.sequence <= this.lastSequence) return
    this.lastSequence = item.sequence
    if (this.preferences.get(item.category) === false) return
    this.items.set(item.id, { ...structuredClone(item), read: false })
  }

  markRead(id: string): void {
    const item = this.items.get(id)
    if (item) this.items.set(id, { ...item, read: true })
  }

  markAllRead(): void {
    for (const [id, item] of this.items) this.items.set(id, { ...item, read: true })
  }

  setPreference(category: string, enabled: boolean): void {
    this.preferences.set(category, enabled)
  }
}

export interface ConversationMessage {
  id: string
  clientId: string
  body: string
  status: 'pending' | 'sent' | 'failed'
  conversationId?: string
  attachments?: Array<{ id: string; url: string; mediaType: string }>
  createdAt?: string
}

export class MessagingController {
  private access: 'allowed' | 'revoked' = 'allowed'
  private messages = new Map<string, ConversationMessage>()
  private members = new Set<string>()
  private typing = new Set<string>()
  private presence = new Map<string, 'online' | 'offline'>()
  private connection: 'online' | 'reconnecting' | 'offline' = 'online'

  get snapshot(): {
    access: 'allowed' | 'revoked'
    messages: ConversationMessage[]
    members: string[]
    typing: string[]
    presence: Record<string, 'online' | 'offline'>
    connection: 'online' | 'reconnecting' | 'offline'
  } {
    return {
      access: this.access,
      messages: [...this.messages.values()].map((message) => structuredClone(message)),
      members: [...this.members].sort(),
      typing: [...this.typing].sort(),
      presence: Object.fromEntries(this.presence),
      connection: this.connection,
    }
  }

  configureMembers(memberIds: string[]): void {
    this.members = new Set(memberIds)
    for (const id of [...this.typing]) if (!this.members.has(id)) this.typing.delete(id)
    for (const id of [...this.presence.keys()]) if (!this.members.has(id)) this.presence.delete(id)
  }

  send(message: Omit<ConversationMessage, 'status'>): void {
    if (this.access === 'revoked') throw new Error('Conversation access revoked')
    if (this.connection === 'offline') throw new Error('Conversation is offline')
    if (!message.body.trim() && !(message.attachments?.length ?? 0)) {
      throw new Error('Message requires text or an attachment')
    }
    if (this.messages.has(message.clientId)) return
    this.messages.set(message.clientId, { ...structuredClone(message), status: 'pending' })
  }

  acknowledge(clientId: string, serverId: string): void {
    const message = this.messages.get(clientId)
    if (!message) return
    this.messages.set(clientId, { ...message, id: serverId, status: 'sent' })
  }

  fail(clientId: string): void {
    const message = this.messages.get(clientId)
    if (message) this.messages.set(clientId, { ...message, status: 'failed' })
  }

  retry(clientId: string): void {
    if (this.access === 'revoked') throw new Error('Conversation access revoked')
    const message = this.messages.get(clientId)
    if (!message || message.status !== 'failed') return
    this.messages.set(clientId, { ...message, status: 'pending' })
  }

  history(options: {
    conversationId?: string
    before?: number
    limit?: number
  } = {}): { items: ConversationMessage[]; nextBefore: number | null } {
    const messages = [...this.messages.values()]
      .filter(
        (message) =>
          !options.conversationId || message.conversationId === options.conversationId,
      )
      .sort((left, right) =>
        (left.createdAt ?? '').localeCompare(right.createdAt ?? ''),
      )
    const end = Math.min(options.before ?? messages.length, messages.length)
    const start = Math.max(0, end - (options.limit ?? 50))
    return {
      items: structuredClone(messages.slice(start, end)),
      nextBefore: start > 0 ? start : null,
    }
  }

  setTyping(memberId: string, active: boolean): void {
    if (this.members.size && !this.members.has(memberId)) {
      throw new Error('Typing member is not in the conversation')
    }
    if (active) this.typing.add(memberId)
    else this.typing.delete(memberId)
  }

  setPresence(memberId: string, value: 'online' | 'offline'): void {
    if (this.members.size && !this.members.has(memberId)) {
      throw new Error('Presence member is not in the conversation')
    }
    this.presence.set(memberId, value)
  }

  setConnection(value: 'online' | 'reconnecting' | 'offline'): void {
    this.connection = value
  }

  revokeAccess(): void {
    this.access = 'revoked'
    for (const [id, message] of this.messages) {
      if (message.status === 'pending') this.messages.set(id, { ...message, status: 'failed' })
    }
  }

  grantAccess(): void {
    this.access = 'allowed'
  }
}

export interface ModerationReport {
  id: string
  targetId: string
  reason: string
  status: 'open' | 'assigned' | 'resolved' | 'dismissed'
  assigneeId: string | null
}

export interface ModerationAuditEntry {
  reportId: string
  actorId: string
  action: string
  reason: string
  timestamp: string
}

export class ModerationController {
  private reports = new Map<string, ModerationReport>()
  private audit: ModerationAuditEntry[] = []

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  get snapshot(): { reports: ModerationReport[]; audit: ModerationAuditEntry[] } {
    return {
      reports: [...this.reports.values()].map((report) => structuredClone(report)),
      audit: structuredClone(this.audit),
    }
  }

  submit(report: Omit<ModerationReport, 'status' | 'assigneeId'>): void {
    if (this.reports.has(report.id)) return
    this.reports.set(report.id, { ...structuredClone(report), status: 'open', assigneeId: null })
  }

  assign(id: string, actorId: string): void {
    const report = this.requireReport(id)
    this.reports.set(id, { ...report, status: 'assigned', assigneeId: actorId })
    this.record(id, actorId, 'assign', 'Claimed for review')
  }

  resolve(id: string, actorId: string, action: string, reason: string): void {
    const report = this.requireReport(id)
    if (report.status === 'resolved' || report.status === 'dismissed') return
    this.reports.set(id, { ...report, status: 'resolved' })
    this.record(id, actorId, action, reason)
  }

  dismiss(id: string, actorId: string, reason: string): void {
    const report = this.requireReport(id)
    if (report.status === 'resolved' || report.status === 'dismissed') return
    this.reports.set(id, { ...report, status: 'dismissed' })
    this.record(id, actorId, 'dismiss', reason)
  }

  private requireReport(id: string): ModerationReport {
    const value = this.reports.get(id)
    if (!value) throw new Error(`Unknown report: ${id}`)
    return value
  }

  private record(reportId: string, actorId: string, action: string, reason: string): void {
    this.audit.push({ reportId, actorId, action, reason, timestamp: this.now() })
  }
}

export class PrivacyController {
  private blocked = new Set<string>()
  private muted = new Set<string>()
  private exportState: 'idle' | 'requested' | 'ready' = 'idle'
  private deletionState: 'idle' | 'requested' | 'scheduled' | 'cancelled' = 'idle'

  get snapshot() {
    return {
      blocked: [...this.blocked],
      muted: [...this.muted],
      exportStatus: this.exportState,
      deletionStatus: this.deletionState,
    }
  }

  block(userId: string): void {
    this.blocked.add(userId)
  }

  unblock(userId: string): void {
    this.blocked.delete(userId)
  }

  mute(userId: string): void {
    this.muted.add(userId)
  }

  unmute(userId: string): void {
    this.muted.delete(userId)
  }

  requestExport(): void {
    this.exportState = 'requested'
  }

  exportReady(): void {
    if (this.exportState !== 'requested') throw new Error('No export request is active')
    this.exportState = 'ready'
  }

  requestDeletion(): void {
    this.deletionState = 'requested'
  }

  scheduleDeletion(): void {
    if (this.deletionState !== 'requested') throw new Error('No deletion request is active')
    this.deletionState = 'scheduled'
  }

  cancelDeletion(): void {
    if (this.deletionState !== 'requested' && this.deletionState !== 'scheduled') return
    this.deletionState = 'cancelled'
  }
}

function uniqueById<T extends CursorEntity>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
