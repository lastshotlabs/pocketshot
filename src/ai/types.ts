export type ConversationStatus = 'active' | 'archived'
export type TurnStatus = 'streaming' | 'complete' | 'stopped' | 'failed'

export interface AiCitation {
  id: string
  title: string
  url?: string
  excerpt?: string
}

export interface AiUsage {
  inputTokens: number
  outputTokens: number
  remaining?: number
  limit?: number
}

export interface AiActionProposal<T = unknown> {
  id: string
  kind: string
  input: T
  rationale?: string
  status: 'proposed' | 'confirmed' | 'rejected' | 'undone'
  provenance: { attemptId: string; conversationId: string; messageId: string }
  result?: unknown
}

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  structuredParts: unknown[]
  citations: AiCitation[]
  actions: AiActionProposal[]
  attemptId?: string
  status: TurnStatus
  createdAt: string
  completedAt?: string
  error?: string
}

export interface AiConversation {
  schemaVersion: 1
  id: string
  title: string
  status: ConversationStatus
  messages: AiMessage[]
  usage: AiUsage | null
  lastSequence: number
  activeAttemptId: string | null
  createdAt: string
  updatedAt: string
}

export type AiStreamEvent =
  | { type: 'delta'; sequence: number; attemptId: string; text: string }
  | { type: 'part'; sequence: number; attemptId: string; part: unknown }
  | { type: 'citation'; sequence: number; attemptId: string; citation: AiCitation }
  | {
      type: 'action'
      sequence: number
      attemptId: string
      action: Omit<AiActionProposal, 'status' | 'provenance'>
    }
  | { type: 'usage'; sequence: number; attemptId: string; usage: AiUsage }
  | { type: 'complete'; sequence: number; attemptId: string }
  | { type: 'error'; sequence: number; attemptId: string; error: string }

export interface AiConversationStorage {
  load(): Promise<AiConversation[]>
  save(conversations: AiConversation[]): Promise<void>
}

export interface AiTurnTransport {
  createAttempt(input: {
    conversationId: string
    message: string
    idempotencyKey: string
  }): Promise<{ attemptId: string; userMessageId: string; assistantMessageId: string }>
  stream(input: {
    conversationId: string
    attemptId: string
    afterSequence: number
    signal: AbortSignal
  }): AsyncIterable<AiStreamEvent>
  cancel(input: { conversationId: string; attemptId: string }): Promise<void>
}

export interface AiActionAdapter {
  commit(action: AiActionProposal): Promise<unknown>
  reject?(action: AiActionProposal): Promise<void>
  undo(action: AiActionProposal): Promise<unknown>
}

export interface AiConversationOptions {
  storage: AiConversationStorage
  transport: AiTurnTransport
  actions?: AiActionAdapter
  reviewPolicy?: 'always' | 'auto'
  now?: () => Date
  createId?: () => string
}

export interface AiMemoryFact {
  id: string
  content: string
  source?: string
  trusted: boolean
  createdAt: string
  updatedAt: string
}

export interface AiMemoryAdapter {
  list(): Promise<AiMemoryFact[]>
  create(input: Omit<AiMemoryFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<AiMemoryFact>
  update(
    id: string,
    patch: Partial<Pick<AiMemoryFact, 'content' | 'trusted'>>,
  ): Promise<AiMemoryFact>
  remove(id: string): Promise<void>
}
