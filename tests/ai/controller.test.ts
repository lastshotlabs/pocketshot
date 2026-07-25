import { describe, expect, it, vi } from 'vitest'
import {
  AiConversationController,
  AiMemoryController,
  createMemoryAiStorage,
  decodeAiStreamEvent,
  type AiStreamEvent,
  type AiTurnTransport,
  type AiConversation,
} from '../../src/ai'

function transport(events: AiStreamEvent[]): AiTurnTransport {
  return {
    createAttempt: vi.fn(async () => ({
      attemptId: 'attempt-1',
      userMessageId: 'user-1',
      assistantMessageId: 'assistant-1',
    })),
    async *stream({ afterSequence, signal }) {
      for (const event of events) {
        if (signal.aborted) {
          const error = new Error('aborted')
          error.name = 'AbortError'
          throw error
        }
        if (event.sequence > afterSequence) yield event
      }
    },
    cancel: vi.fn(async () => undefined),
  }
}

function controller(
  events: AiStreamEvent[],
  overrides: Partial<ConstructorParameters<typeof AiConversationController>[0]> = {},
) {
  let id = 0
  return new AiConversationController({
    storage: createMemoryAiStorage(),
    transport: transport(events),
    createId: () => `id-${++id}`,
    ...overrides,
  })
}

const completeEvents: AiStreamEvent[] = [
  { type: 'delta', sequence: 1, attemptId: 'attempt-1', text: 'Hello ' },
  { type: 'delta', sequence: 2, attemptId: 'attempt-1', text: 'there' },
  {
    type: 'citation',
    sequence: 3,
    attemptId: 'attempt-1',
    citation: { id: 'source-1', title: 'Evidence' },
  },
  {
    type: 'action',
    sequence: 4,
    attemptId: 'attempt-1',
    action: { id: 'action-1', kind: 'log_metric', input: { value: 7 } },
  },
  {
    type: 'usage',
    sequence: 5,
    attemptId: 'attempt-1',
    usage: { inputTokens: 4, outputTokens: 8, remaining: 88 },
  },
  { type: 'complete', sequence: 6, attemptId: 'attempt-1' },
]

describe('AiConversationController', () => {
  it('streams text, citations, actions, usage, and completion durably', async () => {
    const ai = controller(completeEvents)
    const conversation = await ai.create('Coach')
    const result = await ai.send(conversation.id, 'Help me')
    const assistant = result.messages[1]

    expect(assistant.text).toBe('Hello there')
    expect(assistant.citations).toHaveLength(1)
    expect(assistant.actions[0]).toMatchObject({
      status: 'proposed',
      provenance: { attemptId: 'attempt-1', conversationId: conversation.id },
    })
    expect(assistant.status).toBe('complete')
    expect(result.usage?.remaining).toBe(88)
    expect(result.activeAttemptId).toBeNull()
  })

  it('deduplicates replayed sequence numbers', async () => {
    const events = [
      completeEvents[0],
      completeEvents[0],
      { type: 'complete', sequence: 2, attemptId: 'attempt-1' } as const,
    ]
    const ai = controller(events)
    const conversation = await ai.create()
    const result = await ai.send(conversation.id, 'Hello')
    expect(result.messages[1].text).toBe('Hello ')
  })

  it('fails rather than corrupting state on a stream sequence gap', async () => {
    const ai = controller([{ type: 'delta', sequence: 2, attemptId: 'attempt-1', text: 'bad' }])
    const conversation = await ai.create()
    await expect(ai.send(conversation.id, 'Hello')).rejects.toThrow('sequence gap')
    expect(ai.get(conversation.id)?.messages[1]).toMatchObject({
      status: 'failed',
      error: expect.stringContaining('sequence gap'),
    })
  })

  it('coalesces concurrent sends to prevent duplicate attempts', async () => {
    const api = transport(completeEvents)
    const ai = controller([], { transport: api })
    const conversation = await ai.create()
    const [first, second] = await Promise.all([
      ai.send(conversation.id, 'Hello'),
      ai.send(conversation.id, 'Duplicate'),
    ])
    expect(first).toEqual(second)
    expect(api.createAttempt).toHaveBeenCalledTimes(1)
  })

  it('confirms edited actions and supports durable undo', async () => {
    const actions = {
      commit: vi.fn(async (action) => ({ saved: action.input })),
      reject: vi.fn(async () => undefined),
      undo: vi.fn(async () => ({ removed: true })),
    }
    const ai = controller(completeEvents, { actions })
    const conversation = await ai.create()
    await ai.send(conversation.id, 'Log')
    const confirmed = await ai.confirmAction(conversation.id, 'action-1', { value: 9 })
    const undone = await ai.undoAction(conversation.id, 'action-1')

    expect(confirmed).toMatchObject({ status: 'confirmed', input: { value: 9 } })
    expect(undone.status).toBe('undone')
    expect(actions.commit).toHaveBeenCalledTimes(1)
    expect(actions.undo).toHaveBeenCalledTimes(1)
  })

  it('rejects a proposal without committing it', async () => {
    const actions = {
      commit: vi.fn(async () => undefined),
      reject: vi.fn(async () => undefined),
      undo: vi.fn(async () => undefined),
    }
    const ai = controller(completeEvents, { actions })
    const conversation = await ai.create()
    await ai.send(conversation.id, 'No thanks')
    await ai.rejectAction(conversation.id, 'action-1')
    expect(ai.get(conversation.id)?.messages[1].actions[0].status).toBe('rejected')
    expect(actions.reject).toHaveBeenCalled()
    expect(actions.commit).not.toHaveBeenCalled()
  })

  it('automatically commits only when explicitly configured', async () => {
    const actions = {
      commit: vi.fn(async () => 'saved'),
      undo: vi.fn(async () => undefined),
    }
    const ai = controller(completeEvents, { actions, reviewPolicy: 'auto' })
    const conversation = await ai.create()
    const result = await ai.send(conversation.id, 'Log')
    expect(result.messages[1].actions[0]).toMatchObject({
      status: 'confirmed',
      result: 'saved',
    })
  })

  it('supports rename, archive, and delete lifecycle', async () => {
    const ai = controller([])
    const conversation = await ai.create()
    await ai.rename(conversation.id, 'Nutrition')
    await ai.archive(conversation.id)
    expect(ai.list()).toHaveLength(0)
    expect(ai.list(true)[0]).toMatchObject({ title: 'Nutrition', status: 'archived' })
    await ai.remove(conversation.id)
    expect(ai.list(true)).toHaveLength(0)
  })

  it('resumes an interrupted turn after process restart from its durable sequence', async () => {
    const stored: AiConversation = {
      schemaVersion: 1,
      id: 'conversation-1',
      title: 'Coach',
      status: 'active',
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          text: 'Part one',
          structuredParts: [],
          citations: [],
          actions: [],
          attemptId: 'attempt-1',
          status: 'streaming',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      usage: null,
      lastSequence: 1,
      activeAttemptId: 'attempt-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const after: number[] = []
    const api = transport([
      { type: 'delta', sequence: 2, attemptId: 'attempt-1', text: ' and two' },
      { type: 'complete', sequence: 3, attemptId: 'attempt-1' },
    ])
    const original = api.stream
    api.stream = (input) => {
      after.push(input.afterSequence)
      return original(input)
    }
    const ai = new AiConversationController({
      storage: createMemoryAiStorage([stored]),
      transport: api,
    })
    await ai.load()
    const result = await ai.resume(stored.id)
    expect(after).toEqual([1])
    expect(result.messages[0]).toMatchObject({ text: 'Part one and two', status: 'complete' })
  })

  it('pages long message history without losing order', async () => {
    const ai = controller(completeEvents)
    const conversation = await ai.create()
    await ai.send(conversation.id, 'Hello')
    const page = ai.history(conversation.id, { limit: 1 })
    expect(page.messages).toHaveLength(1)
    expect(page.messages[0].role).toBe('assistant')
    expect(page.nextBefore).toBe(1)
  })
})

describe('decodeAiStreamEvent', () => {
  it('rejects malformed deltas', () => {
    expect(() =>
      decodeAiStreamEvent({ type: 'delta', sequence: 1, attemptId: 'a', text: 42 }),
    ).toThrow('Malformed AI delta')
  })
})

describe('AiMemoryController', () => {
  it('manages trusted context facts and reports context status', async () => {
    let facts = [
      {
        id: 'fact-1',
        content: 'Prefers morning workouts',
        trusted: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]
    const memory = new AiMemoryController({
      list: async () => facts,
      create: async (input) => ({
        ...input,
        id: 'fact-2',
        createdAt: '2026-01-02',
        updatedAt: '2026-01-02',
      }),
      update: async (id, patch) => {
        const updated = { ...facts.find((fact) => fact.id === id)!, ...patch }
        facts = facts.map((fact) => (fact.id === id ? updated : fact))
        return updated
      },
      remove: async (id) => {
        facts = facts.filter((fact) => fact.id !== id)
      },
    })
    await memory.load()
    await memory.update('fact-1', { trusted: true })
    expect(memory.status()).toEqual({ facts: 1, trustedFacts: 1, untrustedFacts: 0 })
    await memory.remove('fact-1')
    expect(memory.status().facts).toBe(0)
  })
})
