import { decodeAiStreamEvent } from './decoder'
import type {
  AiActionProposal,
  AiConversation,
  AiConversationOptions,
  AiMessage,
  AiStreamEvent,
} from './types'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export class AiConversationController {
  private conversations: AiConversation[] = []
  private loaded = false
  private readonly listeners = new Set<(conversation: AiConversation) => void>()
  private readonly aborters = new Map<string, AbortController>()
  private readonly turns = new Map<string, Promise<AiConversation>>()
  private readonly actionRuns = new Map<string, Promise<AiActionProposal>>()
  private persistChain: Promise<void> = Promise.resolve()

  constructor(private readonly options: AiConversationOptions) {
    for (const [name, value] of Object.entries({
      maxDeltaCharacters: options.maxDeltaCharacters ?? 100_000,
      maxStructuredParts: options.maxStructuredParts ?? 100,
      maxActionsPerMessage: options.maxActionsPerMessage ?? 25,
      maxCitationsPerMessage: options.maxCitationsPerMessage ?? 100,
      maxMessagesPerConversation: options.maxMessagesPerConversation ?? 2_000,
      maxConversations: options.maxConversations ?? 500,
      maxInputCharacters: options.maxInputCharacters ?? 50_000,
      maxPersistedBytes: options.maxPersistedBytes ?? 20 * 1024 * 1024,
    })) {
      if (!Number.isInteger(value) || value < 1) throw new Error(`[pocketshot] ${name} is invalid`)
    }
  }

  subscribe(listener: (conversation: AiConversation) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(): Promise<AiConversation[]> {
    if (!this.loaded) {
      this.conversations = await this.options.storage.load()
      if (this.conversations.length > (this.options.maxConversations ?? 500)) {
        throw new Error('[pocketshot] AI conversation capacity exceeded')
      }
      this.assertPersistedSize(this.conversations)
      for (const conversation of this.conversations) {
        if (conversation.activeAttemptId) {
          const message = this.assistant(conversation)
          if (message?.status === 'streaming') message.status = 'stopped'
        }
      }
      this.loaded = true
      await this.persist()
    }
    return this.list()
  }

  list(includeArchived = false): AiConversation[] {
    return clone(
      this.conversations.filter(
        (conversation) => includeArchived || conversation.status === 'active',
      ),
    )
  }

  get(id: string): AiConversation | null {
    const conversation = this.conversations.find((item) => item.id === id)
    return conversation ? clone(conversation) : null
  }

  history(
    conversationId: string,
    options: { before?: number; limit?: number } = {},
  ): { messages: AiMessage[]; nextBefore: number | null } {
    const messages = this.require(conversationId).messages
    const end = Math.min(options.before ?? messages.length, messages.length)
    const start = Math.max(0, end - (options.limit ?? 50))
    return {
      messages: clone(messages.slice(start, end)),
      nextBefore: start > 0 ? start : null,
    }
  }

  async create(title = 'New conversation'): Promise<AiConversation> {
    await this.load()
    if (!title.trim() || title.length > 200)
      throw new Error('[pocketshot] Conversation title is invalid')
    if (this.conversations.length >= (this.options.maxConversations ?? 500)) {
      throw new Error('[pocketshot] AI conversation capacity exceeded')
    }
    const timestamp = this.now()
    const conversation: AiConversation = {
      schemaVersion: 1,
      id: this.id(),
      title: title.trim(),
      status: 'active',
      messages: [],
      usage: null,
      lastSequence: 0,
      activeAttemptId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.conversations.unshift(conversation)
    await this.changed(conversation)
    return clone(conversation)
  }

  async rename(id: string, title: string): Promise<void> {
    if (!title.trim()) throw new Error('[pocketshot] Conversation title cannot be empty')
    await this.update(this.require(id), { title: title.trim() })
  }

  async archive(id: string): Promise<void> {
    await this.update(this.require(id), { status: 'archived' })
  }

  async remove(id: string): Promise<void> {
    await this.stop(id)
    this.conversations = this.conversations.filter((item) => item.id !== id)
    await this.persist()
  }

  send(
    conversationId: string,
    message: string,
    idempotencyKey = this.id(),
  ): Promise<AiConversation> {
    const existing = this.turns.get(conversationId)
    if (existing) return existing
    const turn = this.startTurn(conversationId, message, idempotencyKey).finally(() =>
      this.turns.delete(conversationId),
    )
    this.turns.set(conversationId, turn)
    return turn
  }

  resume(conversationId: string): Promise<AiConversation> {
    const existing = this.turns.get(conversationId)
    if (existing) return existing
    const turn = this.resumeTurn(conversationId).finally(() => this.turns.delete(conversationId))
    this.turns.set(conversationId, turn)
    return turn
  }

  async retry(conversationId: string): Promise<AiConversation> {
    const conversation = this.require(conversationId)
    const lastUser = [...conversation.messages].reverse().find((message) => message.role === 'user')
    if (!lastUser) throw new Error('[pocketshot] No user turn to retry')
    return this.send(conversationId, lastUser.text)
  }

  async stop(conversationId: string): Promise<void> {
    const conversation = this.conversations.find((item) => item.id === conversationId)
    if (!conversation?.activeAttemptId) return
    const attemptId = conversation.activeAttemptId
    this.aborters.get(conversationId)?.abort()
    await this.options.transport.cancel({ conversationId, attemptId })
    const message = this.assistant(conversation)
    if (message?.status === 'streaming') message.status = 'stopped'
    await this.update(conversation, { activeAttemptId: null })
  }

  async confirmAction(
    conversationId: string,
    actionId: string,
    editedInput?: unknown,
  ): Promise<AiActionProposal> {
    const key = `${conversationId}:${actionId}:commit`
    const existing = this.actionRuns.get(key)
    if (existing) return existing
    const run = this.performConfirmAction(conversationId, actionId, editedInput).finally(() =>
      this.actionRuns.delete(key),
    )
    this.actionRuns.set(key, run)
    return run
  }

  private async performConfirmAction(
    conversationId: string,
    actionId: string,
    editedInput?: unknown,
  ): Promise<AiActionProposal> {
    const { conversation, action } = this.findAction(conversationId, actionId)
    if (action.status === 'confirmed') return clone(action)
    if (action.status !== 'proposed') {
      throw new Error('[pocketshot] Only proposed AI actions can be confirmed')
    }
    if (!this.options.actions) throw new Error('[pocketshot] No AI action adapter configured')
    const candidate = clone(action)
    if (editedInput !== undefined) candidate.input = clone(editedInput)
    await this.authorize('commit', candidate)
    const result = await this.options.actions.commit(clone(candidate))
    action.input = candidate.input
    action.result = result
    action.status = 'confirmed'
    await this.changed(conversation)
    return clone(action)
  }

  async rejectAction(conversationId: string, actionId: string): Promise<void> {
    const { conversation, action } = this.findAction(conversationId, actionId)
    if (action.status !== 'proposed') return
    await this.options.actions?.reject?.(clone(action))
    action.status = 'rejected'
    await this.changed(conversation)
  }

  async undoAction(conversationId: string, actionId: string): Promise<AiActionProposal> {
    const key = `${conversationId}:${actionId}:undo`
    const existing = this.actionRuns.get(key)
    if (existing) return existing
    const run = this.performUndoAction(conversationId, actionId).finally(() =>
      this.actionRuns.delete(key),
    )
    this.actionRuns.set(key, run)
    return run
  }

  private async performUndoAction(
    conversationId: string,
    actionId: string,
  ): Promise<AiActionProposal> {
    const { conversation, action } = this.findAction(conversationId, actionId)
    if (action.status !== 'confirmed')
      throw new Error('[pocketshot] Only confirmed actions can be undone')
    if (!this.options.actions) throw new Error('[pocketshot] No AI action adapter configured')
    await this.authorize('undo', action)
    action.result = await this.options.actions.undo(clone(action))
    action.status = 'undone'
    await this.changed(conversation)
    return clone(action)
  }

  private async startTurn(
    conversationId: string,
    text: string,
    idempotencyKey: string,
  ): Promise<AiConversation> {
    await this.load()
    if (
      !text.trim() ||
      text.length > (this.options.maxInputCharacters ?? 50_000) ||
      !idempotencyKey.trim()
    ) {
      throw new Error('[pocketshot] AI message or idempotency key is invalid')
    }
    const conversation = this.require(conversationId)
    if (conversation.messages.length + 2 > (this.options.maxMessagesPerConversation ?? 2_000)) {
      throw new Error('[pocketshot] AI message capacity exceeded')
    }
    const attempt = await this.options.transport.createAttempt({
      conversationId,
      message: text,
      idempotencyKey,
    })
    const timestamp = this.now()
    conversation.messages.push(
      {
        id: attempt.userMessageId,
        role: 'user',
        text,
        structuredParts: [],
        citations: [],
        actions: [],
        status: 'complete',
        createdAt: timestamp,
        completedAt: timestamp,
      },
      {
        id: attempt.assistantMessageId,
        role: 'assistant',
        text: '',
        structuredParts: [],
        citations: [],
        actions: [],
        attemptId: attempt.attemptId,
        status: 'streaming',
        createdAt: timestamp,
      },
    )
    conversation.lastSequence = 0
    conversation.activeAttemptId = attempt.attemptId
    await this.changed(conversation)
    return this.consume(conversation)
  }

  private async resumeTurn(conversationId: string): Promise<AiConversation> {
    await this.load()
    const conversation = this.require(conversationId)
    if (!conversation.activeAttemptId) throw new Error('[pocketshot] No interrupted turn to resume')
    const message = this.assistant(conversation)
    if (message) message.status = 'streaming'
    await this.changed(conversation)
    return this.consume(conversation)
  }

  private async consume(conversation: AiConversation): Promise<AiConversation> {
    const attemptId = conversation.activeAttemptId!
    const controller = new AbortController()
    this.aborters.set(conversation.id, controller)
    try {
      for await (const raw of this.options.transport.stream({
        conversationId: conversation.id,
        attemptId,
        afterSequence: conversation.lastSequence,
        signal: controller.signal,
      })) {
        const event = decodeAiStreamEvent(raw)
        if (event.attemptId !== attemptId || event.sequence <= conversation.lastSequence) continue
        if (event.sequence !== conversation.lastSequence + 1) {
          throw new Error('[pocketshot] AI stream sequence gap')
        }
        await this.apply(conversation, event)
      }
      const message = this.assistant(conversation)
      if (message?.status === 'streaming')
        throw new Error('[pocketshot] AI stream ended before completion')
      return clone(conversation)
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        const message = this.assistant(conversation)
        if (message) {
          message.status = 'failed'
          message.error = this.safeError(error)
        }
        await this.changed(conversation)
      }
      throw error
    } finally {
      this.aborters.delete(conversation.id)
    }
  }

  private async apply(conversation: AiConversation, event: AiStreamEvent): Promise<void> {
    const message = this.assistant(conversation)
    if (!message) throw new Error('[pocketshot] Missing assistant message')
    conversation.lastSequence = event.sequence
    if (event.type === 'delta') {
      if (message.text.length + event.text.length > (this.options.maxDeltaCharacters ?? 100_000)) {
        throw new Error('[pocketshot] AI text limit exceeded')
      }
      message.text += event.text
    }
    if (event.type === 'part') {
      if (message.structuredParts.length >= (this.options.maxStructuredParts ?? 100)) {
        throw new Error('[pocketshot] AI structured-part limit exceeded')
      }
      message.structuredParts.push(event.part)
    }
    if (
      event.type === 'citation' &&
      !message.citations.some((item) => item.id === event.citation.id)
    ) {
      if (message.citations.length >= (this.options.maxCitationsPerMessage ?? 100)) {
        throw new Error('[pocketshot] AI citation limit exceeded')
      }
      message.citations.push(event.citation)
    }
    if (event.type === 'action' && !message.actions.some((item) => item.id === event.action.id)) {
      if (message.actions.length >= (this.options.maxActionsPerMessage ?? 25)) {
        throw new Error('[pocketshot] AI action limit exceeded')
      }
      const action: AiActionProposal = {
        ...event.action,
        status: 'proposed',
        provenance: {
          attemptId: event.attemptId,
          conversationId: conversation.id,
          messageId: message.id,
        },
      }
      message.actions.push(action)
      if (
        this.options.reviewPolicy === 'auto' &&
        this.options.automaticActionKinds?.includes(action.kind) &&
        this.options.actions
      ) {
        await this.authorize('commit', action)
        action.result = await this.options.actions.commit(clone(action))
        action.status = 'confirmed'
      }
    }
    if (event.type === 'usage') conversation.usage = event.usage
    if (event.type === 'error') {
      message.status = 'failed'
      message.error = this.safeError(event.error)
      conversation.activeAttemptId = null
    }
    if (event.type === 'complete') {
      message.status = 'complete'
      message.completedAt = this.now()
      conversation.activeAttemptId = null
    }
    await this.changed(conversation)
  }

  private assistant(conversation: AiConversation): AiMessage | undefined {
    return [...conversation.messages]
      .reverse()
      .find(
        (message) =>
          message.role === 'assistant' &&
          (!conversation.activeAttemptId || message.attemptId === conversation.activeAttemptId),
      )
  }

  private async authorize(operation: 'commit' | 'undo', action: AiActionProposal): Promise<void> {
    if (!this.options.authorization) return
    const allowed = await this.options.authorization.authorize({
      operation,
      action: clone(action),
    })
    if (!allowed) throw new Error('[pocketshot] AI action authorization revoked')
  }

  private findAction(conversationId: string, actionId: string) {
    const conversation = this.require(conversationId)
    for (const message of conversation.messages) {
      const action = message.actions.find((item) => item.id === actionId)
      if (action) return { conversation, action }
    }
    throw new Error(`[pocketshot] Unknown AI action: ${actionId}`)
  }

  private require(id: string): AiConversation {
    const conversation = this.conversations.find((item) => item.id === id)
    if (!conversation) throw new Error(`[pocketshot] Unknown conversation: ${id}`)
    return conversation
  }

  private async update(conversation: AiConversation, patch: Partial<AiConversation>) {
    Object.assign(conversation, patch)
    await this.changed(conversation)
  }

  private async changed(conversation: AiConversation) {
    conversation.updatedAt = this.now()
    await this.persist()
    for (const listener of this.listeners) listener(clone(conversation))
  }

  private async persist() {
    const snapshot = clone(this.conversations)
    this.assertPersistedSize(snapshot)
    const save = this.persistChain.then(() => this.options.storage.save(snapshot))
    this.persistChain = save.catch(() => undefined)
    await save
  }

  private assertPersistedSize(conversations: AiConversation[]): void {
    const bytes = new TextEncoder().encode(JSON.stringify(conversations)).byteLength
    if (bytes > (this.options.maxPersistedBytes ?? 20 * 1024 * 1024)) {
      throw new Error('[pocketshot] AI persisted storage limit exceeded')
    }
  }

  private safeError(error: unknown): string {
    const value = (
      this.options.sanitizeError?.(error) ??
      (error instanceof Error ? error.name : 'AI operation failed')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (value || 'AI operation failed').slice(0, 160)
  }

  private id(): string {
    return this.options.createId?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  private now(): string {
    return (this.options.now?.() ?? new Date()).toISOString()
  }
}
