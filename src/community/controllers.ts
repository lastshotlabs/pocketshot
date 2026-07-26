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
  anchorId?: string | null
  pendingMutationIds?: string[]
}

export class CursorFeedController<T extends CursorEntity> {
  private itemsValue: T[] = []
  private nextCursorValue: string | null = null
  private versionValue = 0
  private staleValue = false
  private anchorIdValue: string | null = null
  private optimistic = new Map<string, T[]>()

  constructor(
    private readonly options: {
      compare?: (left: T, right: T) => number
      version?: (item: T) => number
    } = {},
  ) {}

  get snapshot(): CursorFeedSnapshot<T> {
    return {
      items: structuredClone(this.itemsValue),
      nextCursor: this.nextCursorValue,
      version: this.versionValue,
      isStale: this.staleValue,
      anchorId: this.anchorIdValue,
      pendingMutationIds: [...this.optimistic.keys()],
    }
  }

  replace(page: CursorPage<T>): void {
    if (page.version < this.versionValue) return
    this.itemsValue = this.order(this.mergeByVersion([], page.items))
    this.nextCursorValue = page.nextCursor
    this.versionValue = page.version
    this.staleValue = false
  }

  append(page: CursorPage<T>, requestedCursor: string | null): void {
    if (requestedCursor !== this.nextCursorValue || page.version < this.versionValue) {
      this.staleValue = true
      return
    }
    this.itemsValue = this.order(this.mergeByVersion(this.itemsValue, page.items))
    this.nextCursorValue = page.nextCursor
    this.versionValue = page.version
  }

  upsert(item: T, position: 'start' | 'end' = 'start'): void {
    const existing = this.itemsValue.find((candidate) => candidate.id === item.id)
    if (
      existing &&
      this.options.version &&
      this.options.version(item) < this.options.version(existing)
    ) {
      return
    }
    const remaining = this.itemsValue.filter((candidate) => candidate.id !== item.id)
    this.itemsValue = this.order(position === 'start' ? [item, ...remaining] : [...remaining, item])
  }

  remove(id: string): void {
    this.itemsValue = this.itemsValue.filter((item) => item.id !== id)
  }

  markStale(): void {
    this.staleValue = true
  }

  setAnchor(id: string | null): void {
    if (id !== null && !this.itemsValue.some((item) => item.id === id)) {
      throw new Error(`Unknown feed anchor: ${id}`)
    }
    this.anchorIdValue = id
  }

  anchorIndex(): number | null {
    if (!this.anchorIdValue) return null
    const index = this.itemsValue.findIndex((item) => item.id === this.anchorIdValue)
    return index < 0 ? null : index
  }

  optimisticUpsert(mutationId: string, item: T, position: 'start' | 'end' = 'start'): boolean {
    if (this.optimistic.has(mutationId)) return false
    this.optimistic.set(mutationId, structuredClone(this.itemsValue))
    this.upsert(item, position)
    return true
  }

  optimisticRemove(mutationId: string, id: string): boolean {
    if (this.optimistic.has(mutationId)) return false
    this.optimistic.set(mutationId, structuredClone(this.itemsValue))
    this.remove(id)
    return true
  }

  settleOptimistic(mutationId: string, accepted: boolean): void {
    const previous = this.optimistic.get(mutationId)
    if (!previous) return
    if (!accepted) this.itemsValue = previous
    this.optimistic.delete(mutationId)
  }

  private order(items: T[]): T[] {
    return this.options.compare ? [...items].sort(this.options.compare) : items
  }

  private mergeByVersion(existing: T[], incoming: T[]): T[] {
    const values = new Map(existing.map((item) => [item.id, structuredClone(item)]))
    for (const item of incoming) {
      const current = values.get(item.id)
      if (
        !current ||
        !this.options.version ||
        this.options.version(item) >= this.options.version(current)
      ) {
        values.set(item.id, structuredClone(item))
      }
    }
    return [...values.values()]
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
  channel?: string
  route?: string
}

export class NotificationInboxController {
  private items = new Map<string, CommunityNotification>()
  private lastSequence = 0
  private preferences = new Map<string, boolean>()
  private readCursors = new Map<string, number>()
  private processedEvents = new Set<string>()

  constructor(
    private readonly limits = { items: 1_000, processedEvents: 10_000, preferences: 500 },
  ) {
    for (const value of Object.values(limits)) {
      if (!Number.isInteger(value) || value < 1) throw new Error('Notification limits are invalid')
    }
  }

  get snapshot(): {
    items: CommunityNotification[]
    unread: number
    unreadByChannel: Record<string, number>
    lastSequence: number
    readCursors: Record<string, number>
    preferences: Record<string, boolean>
  } {
    const items = [...this.items.values()]
      .sort((left, right) => right.sequence - left.sequence)
      .map((item) => structuredClone(item))
    return {
      items,
      unread: items.filter((item) => !item.read).length,
      unreadByChannel: Object.fromEntries(
        [...new Set(items.map((item) => item.channel ?? 'default'))]
          .sort()
          .map((channel) => [
            channel,
            items.filter((item) => (item.channel ?? 'default') === channel && !item.read).length,
          ]),
      ),
      lastSequence: this.lastSequence,
      readCursors: Object.fromEntries(this.readCursors),
      preferences: Object.fromEntries(this.preferences),
    }
  }

  receive(item: Omit<CommunityNotification, 'read'>): void {
    if (this.items.has(item.id) || item.sequence <= this.lastSequence) return
    this.lastSequence = item.sequence
    if (this.preferences.get(item.category) === false) return
    if (this.items.size >= this.limits.items) {
      const oldest = [...this.items.values()].sort((left, right) => left.sequence - right.sequence)[0]
      if (oldest) this.items.delete(oldest.id)
    }
    this.items.set(item.id, { ...structuredClone(item), read: false })
  }

  applyEvent(
    event: {
      eventId: string
      notification: Omit<CommunityNotification, 'read'>
    },
    strictOrdering = true,
  ): boolean {
    if (this.processedEvents.has(event.eventId)) return false
    if (strictOrdering && event.notification.sequence !== this.lastSequence + 1) {
      throw new Error('Notification event sequence gap')
    }
    if (event.notification.sequence <= this.lastSequence) return false
    if (this.processedEvents.size >= this.limits.processedEvents) {
      this.processedEvents.delete(this.processedEvents.values().next().value!)
    }
    this.processedEvents.add(event.eventId)
    this.receive(event.notification)
    return true
  }

  markRead(id: string): void {
    const item = this.items.get(id)
    if (item) {
      this.items.set(id, { ...item, read: true })
      const channel = item.channel ?? 'default'
      this.readCursors.set(channel, Math.max(this.readCursors.get(channel) ?? 0, item.sequence))
    }
  }

  markAllRead(): void {
    for (const [id, item] of this.items) {
      this.items.set(id, { ...item, read: true })
      const channel = item.channel ?? 'default'
      this.readCursors.set(channel, Math.max(this.readCursors.get(channel) ?? 0, item.sequence))
    }
  }

  setPreference(category: string, enabled: boolean): void {
    if (!category.trim()) throw new Error('Notification category is required')
    if (!this.preferences.has(category) && this.preferences.size >= this.limits.preferences) {
      throw new Error('Notification preference capacity exceeded')
    }
    this.preferences.set(category, enabled)
  }

  openRoute(
    id: string,
    allowedPrefixes: string[],
  ): { notificationId: string; route: string } | null {
    const item = this.items.get(id)
    if (!item?.route) return null
    if (!item.route.startsWith('/') || item.route.startsWith('//')) {
      throw new Error('Notification route must be app-relative')
    }
    const url = new URL(item.route, 'https://pocketshot.invalid')
    const route = `${url.pathname}${url.search}${url.hash}`
    if (
      !allowedPrefixes.some(
        (prefix) =>
          route === prefix || route.startsWith(`${prefix}/`) || route.startsWith(`${prefix}?`),
      )
    ) {
      throw new Error('Notification route is not allowlisted')
    }
    this.markRead(id)
    return { notificationId: id, route }
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

  constructor(
    private readonly limits = { messages: 10_000, members: 1_000, bodyCharacters: 100_000 },
  ) {
    for (const value of Object.values(limits)) {
      if (!Number.isInteger(value) || value < 1) throw new Error('Messaging limits are invalid')
    }
  }

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
    if (memberIds.length > this.limits.members || memberIds.some((id) => !id.trim())) {
      throw new Error('Conversation membership is invalid')
    }
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
    if (
      !message.id.trim() ||
      !message.clientId.trim() ||
      message.body.length > this.limits.bodyCharacters ||
      (message.attachments?.length ?? 0) > 20
    ) {
      throw new Error('Message content is invalid')
    }
    if (this.messages.has(message.clientId)) return
    if (this.messages.size >= this.limits.messages) throw new Error('Message capacity exceeded')
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

  history(
    options: {
      conversationId?: string
      before?: number
      limit?: number
    } = {},
  ): { items: ConversationMessage[]; nextBefore: number | null } {
    const messages = [...this.messages.values()]
      .filter(
        (message) => !options.conversationId || message.conversationId === options.conversationId,
      )
      .sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? ''))
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

  revokeAccess(options: { clearMessages?: boolean; clearMembership?: boolean } = {}): void {
    this.access = 'revoked'
    this.typing.clear()
    this.presence.clear()
    if (options.clearMembership) this.members.clear()
    if (options.clearMessages) {
      this.messages.clear()
    } else {
      for (const [id, message] of this.messages) {
        if (message.status === 'pending') this.messages.set(id, { ...message, status: 'failed' })
      }
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

export interface ModerationControllerOptions {
  authorize?(input: {
    actorId: string
    operation: 'assign' | 'resolve' | 'dismiss' | 'note'
    report: ModerationReport
  }): boolean
  maxAuditEntries?: number
  maxNotesPerReport?: number
  maxPendingActions?: number
}

export class ModerationController {
  private reports = new Map<string, ModerationReport>()
  private audit: ModerationAuditEntry[] = []
  private pending = new Map<
    string,
    { reportId: string; actorId: string; action: string; reason: string }
  >()
  private notes = new Map<string, Array<{ actorId: string; text: string; timestamp: string }>>()

  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly options: ModerationControllerOptions = {},
  ) {}

  get snapshot(): {
    reports: ModerationReport[]
    audit: ModerationAuditEntry[]
    pendingActions: Array<{
      id: string
      reportId: string
      actorId: string
      action: string
      reason: string
    }>
    notes: Record<string, Array<{ actorId: string; text: string; timestamp: string }>>
  } {
    return {
      reports: [...this.reports.values()].map((report) => structuredClone(report)),
      audit: structuredClone(this.audit),
      pendingActions: [...this.pending].map(([id, action]) => ({
        id,
        ...structuredClone(action),
      })),
      notes: structuredClone(Object.fromEntries(this.notes)),
    }
  }

  submit(report: Omit<ModerationReport, 'status' | 'assigneeId'>): void {
    if (!report.id.trim() || !report.targetId.trim() || !report.reason.trim()) {
      throw new Error('Moderation report requires an ID, target, and reason')
    }
    if (this.reports.has(report.id)) return
    this.reports.set(report.id, { ...structuredClone(report), status: 'open', assigneeId: null })
  }

  assign(id: string, actorId: string): void {
    const report = this.requireReport(id)
    this.authorize(actorId, 'assign', report)
    this.reports.set(id, { ...report, status: 'assigned', assigneeId: actorId })
    this.record(id, actorId, 'assign', 'Claimed for review')
  }

  resolve(id: string, actorId: string, action: string, reason: string): void {
    const report = this.requireReport(id)
    if (report.status === 'resolved' || report.status === 'dismissed') return
    if (!action.trim() || !reason.trim()) throw new Error('Moderation resolution is incomplete')
    this.authorize(actorId, 'resolve', report)
    this.reports.set(id, { ...report, status: 'resolved' })
    this.record(id, actorId, action, reason)
  }

  dismiss(id: string, actorId: string, reason: string): void {
    const report = this.requireReport(id)
    if (report.status === 'resolved' || report.status === 'dismissed') return
    if (!reason.trim()) throw new Error('Moderation dismissal reason is required')
    this.authorize(actorId, 'dismiss', report)
    this.reports.set(id, { ...report, status: 'dismissed' })
    this.record(id, actorId, 'dismiss', reason)
  }

  addNote(reportId: string, actorId: string, text: string): void {
    const report = this.requireReport(reportId)
    this.authorize(actorId, 'note', report)
    if (!text.trim()) throw new Error('Moderator note cannot be empty')
    const notes = this.notes.get(reportId) ?? []
    if (notes.length >= (this.options.maxNotesPerReport ?? 500)) {
      throw new Error('Moderator note limit reached')
    }
    notes.push({ actorId, text: text.trim(), timestamp: this.now() })
    this.notes.set(reportId, notes)
  }

  proposeAction(
    id: string,
    input: { reportId: string; actorId: string; action: string; reason: string },
  ): void {
    this.requireReport(input.reportId)
    if (!id || !input.action.trim() || !input.reason.trim()) {
      throw new Error('Moderation proposal requires action and reason')
    }
    if (this.pending.has(id)) return
    if (this.pending.size >= (this.options.maxPendingActions ?? 500)) {
      throw new Error('Moderation proposal limit reached')
    }
    this.pending.set(id, structuredClone(input))
  }

  confirmAction(id: string): void {
    const pending = this.pending.get(id)
    if (!pending) throw new Error(`Unknown moderation action proposal: ${id}`)
    this.resolve(pending.reportId, pending.actorId, pending.action, pending.reason)
    this.pending.delete(id)
  }

  cancelAction(id: string): void {
    this.pending.delete(id)
  }

  private requireReport(id: string): ModerationReport {
    const value = this.reports.get(id)
    if (!value) throw new Error(`Unknown report: ${id}`)
    return value
  }

  private record(reportId: string, actorId: string, action: string, reason: string): void {
    this.audit.push({ reportId, actorId, action, reason, timestamp: this.now() })
    this.audit = this.audit.slice(-(this.options.maxAuditEntries ?? 5_000))
  }

  private authorize(
    actorId: string,
    operation: 'assign' | 'resolve' | 'dismiss' | 'note',
    report: ModerationReport,
  ): void {
    if (!actorId.trim()) throw new Error('Moderation actor is required')
    if (
      (operation === 'resolve' || operation === 'dismiss') &&
      report.assigneeId &&
      report.assigneeId !== actorId &&
      !this.options.authorize
    ) {
      throw new Error('Moderation report is assigned to another actor')
    }
    if (this.options.authorize && !this.options.authorize({ actorId, operation, report })) {
      throw new Error('Moderation authorization revoked')
    }
  }
}

export type CommunityRole = 'guest' | 'member' | 'moderator' | 'admin'
export type CommunityPermission = 'read' | 'post' | 'reply' | 'message' | 'moderate' | 'administer'

export class CommunityAuthorizationController {
  private roles = new Map<string, CommunityRole>()
  private revokedScopes = new Map<string, Set<string>>()

  setRole(actorId: string, role: CommunityRole): void {
    if (!actorId.trim()) throw new Error('Community actor is required')
    this.roles.set(actorId, role)
  }

  revoke(actorId: string, scope: string): void {
    if (!actorId.trim() || !scope.trim()) throw new Error('Community revocation is invalid')
    const scopes = this.revokedScopes.get(actorId) ?? new Set<string>()
    scopes.add(scope)
    this.revokedScopes.set(actorId, scopes)
  }

  restore(actorId: string, scope: string): void {
    if (!actorId.trim() || !scope.trim()) throw new Error('Community restoration is invalid')
    this.revokedScopes.get(actorId)?.delete(scope)
  }

  can(actorId: string, permission: CommunityPermission, scope = '*'): boolean {
    if (this.revokedScopes.get(actorId)?.has('*') || this.revokedScopes.get(actorId)?.has(scope)) {
      return false
    }
    const role = this.roles.get(actorId) ?? 'guest'
    const permissions: Record<CommunityRole, CommunityPermission[]> = {
      guest: ['read'],
      member: ['read', 'post', 'reply', 'message'],
      moderator: ['read', 'post', 'reply', 'message', 'moderate'],
      admin: ['read', 'post', 'reply', 'message', 'moderate', 'administer'],
    }
    return permissions[role].includes(permission)
  }

  require(actorId: string, permission: CommunityPermission, scope = '*'): void {
    if (!this.can(actorId, permission, scope)) {
      throw new Error('Community authorization revoked or insufficient')
    }
  }
}

export interface AutomodPolicy {
  id: string
  kind: 'blocked-term' | 'link-limit' | 'rate-limit'
  value: string | number
  action: 'allow' | 'flag' | 'reject'
  explanation: string
  enabled: boolean
}

export interface AutomodDecision {
  allowed: boolean
  action: 'allow' | 'flag' | 'reject'
  matchedPolicyIds: string[]
  explanations: string[]
}

export class AutomodController {
  private policies = new Map<string, AutomodPolicy>()
  private recent = new Map<string, number[]>()

  constructor(
    private readonly now: () => number = Date.now,
    private readonly limits = { policies: 500, actors: 10_000, eventsPerActor: 1_000 },
  ) {
    for (const value of Object.values(limits)) {
      if (!Number.isInteger(value) || value < 1) throw new Error('Automod limits are invalid')
    }
  }

  savePolicy(policy: AutomodPolicy): void {
    if (!policy.id || !policy.explanation.trim()) {
      throw new Error('Automod policy requires an ID and explanation')
    }
    if (
      (policy.kind === 'blocked-term' &&
        (typeof policy.value !== 'string' || !policy.value.trim())) ||
      (policy.kind !== 'blocked-term' &&
        (typeof policy.value !== 'number' || !Number.isInteger(policy.value) || policy.value < 1))
    ) {
      throw new Error('Automod policy value is invalid')
    }
    if (!this.policies.has(policy.id) && this.policies.size >= this.limits.policies) {
      throw new Error('Automod policy capacity exceeded')
    }
    this.policies.set(policy.id, structuredClone(policy))
  }

  evaluate(input: { actorId: string; text: string; windowMs?: number }): AutomodDecision {
    if (!input.actorId.trim() || !Number.isFinite(input.windowMs ?? 60_000) || (input.windowMs ?? 60_000) <= 0) {
      throw new Error('Automod evaluation is invalid')
    }
    const matches: AutomodPolicy[] = []
    const text = input.text.toLocaleLowerCase()
    const now = this.now()
    const windowMs = input.windowMs ?? 60_000
    for (const [actorId, values] of this.recent) {
      const active = values.filter((timestamp) => timestamp > now - windowMs)
      if (active.length) this.recent.set(actorId, active)
      else this.recent.delete(actorId)
    }
    if (!this.recent.has(input.actorId) && this.recent.size >= this.limits.actors) {
      throw new Error('Automod actor capacity exceeded')
    }
    const timestamps = (this.recent.get(input.actorId) ?? []).filter(
      (timestamp) => timestamp > now - windowMs,
    )
    timestamps.push(now)
    if (timestamps.length > this.limits.eventsPerActor) timestamps.shift()
    this.recent.set(input.actorId, timestamps)

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue
      if (
        policy.kind === 'blocked-term' &&
        text.includes(String(policy.value).toLocaleLowerCase())
      ) {
        matches.push(policy)
      }
      if (
        policy.kind === 'link-limit' &&
        (input.text.match(/https?:\/\//gi)?.length ?? 0) > Number(policy.value)
      ) {
        matches.push(policy)
      }
      if (policy.kind === 'rate-limit' && timestamps.length > Number(policy.value)) {
        matches.push(policy)
      }
    }
    const action = matches.some((policy) => policy.action === 'reject')
      ? 'reject'
      : matches.some((policy) => policy.action === 'flag')
        ? 'flag'
        : 'allow'
    return {
      allowed: action !== 'reject',
      action,
      matchedPolicyIds: matches.map((policy) => policy.id),
      explanations: matches.map((policy) => policy.explanation),
    }
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
