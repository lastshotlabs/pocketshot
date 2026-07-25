import {
  AiConversationController,
  AiMemoryController,
  createMemoryAiStorage,
  type AiMemoryFact,
  type AiStreamEvent,
} from '@lastshotlabs/pocketshot/ai'
import {
  MediaPipelineController,
  createMemoryMediaStorage,
  type MediaAsset,
  type MediaCaptureAdapter,
} from '@lastshotlabs/pocketshot/media'

export interface CoachActionCallbacks {
  commit(id: string, value: number): void
  undo(id: string): void
}

export function createCoachConversation(callbacks: CoachActionCallbacks): AiConversationController {
  let attempt = 0
  return new AiConversationController({
    storage: createMemoryAiStorage(),
    transport: {
      createAttempt: async () => {
        attempt += 1
        return {
          attemptId: `attempt-${attempt}`,
          userMessageId: `user-${attempt}`,
          assistantMessageId: `assistant-${attempt}`,
        }
      },
      stream: ({ attemptId, afterSequence, signal }) =>
        createCoachStream(attemptId, afterSequence, signal),
      cancel: async () => undefined,
    },
    actions: {
      commit: async (action) => {
        callbacks.commit(action.id, Number((action.input as { value?: number }).value ?? 0))
        return { logId: action.id }
      },
      reject: async () => undefined,
      undo: async (action) => {
        callbacks.undo(action.id)
        return { undone: true }
      },
    },
  })
}

export function createCoachMedia(capture: MediaCaptureAdapter): MediaPipelineController {
  let mediaId = 0
  return new MediaPipelineController({
    capture,
    upload: {
      strategy: 'multipart-resumable',
      createSession: async () => ({ id: 'upload-1', offset: 0, chunkSize: 5 }),
      getOffset: async () => 0,
      uploadChunk: async ({ offset, length }) => ({ offset: offset + length }),
      complete: async () => ({ fileUrl: 'https://cdn.example.test/photo.jpg' }),
      cancel: async () => undefined,
    },
    analysis: {
      start: async () => ({ jobId: 'analysis-1' }),
      status: async () => ({ state: 'complete', result: { summary: 'Balanced meal' } }),
      cancel: async () => undefined,
    },
    storage: createMemoryMediaStorage(),
    createId: () => `media-${++mediaId}`,
    wait: async () => undefined,
  })
}

export function createCoachMemory(facts: AiMemoryFact[]): AiMemoryController {
  return new AiMemoryController({
    list: async () => facts,
    create: async (input) => {
      const now = new Date().toISOString()
      const fact = { ...input, id: `fact-${facts.length + 1}`, createdAt: now, updatedAt: now }
      facts.push(fact)
      return fact
    },
    update: async (id, patch) => {
      const index = facts.findIndex((fact) => fact.id === id)
      const fact = { ...facts[index], ...patch, updatedAt: new Date().toISOString() }
      facts[index] = fact
      return fact
    },
    remove: async (id) => {
      const index = facts.findIndex((fact) => fact.id === id)
      if (index >= 0) facts.splice(index, 1)
    },
  })
}

export function defaultCoachCapture(): MediaCaptureAdapter {
  return {
    requestPermission: async () => ({ state: 'granted', canAskAgain: true }),
    acquire: async () => demoPhoto(),
  }
}

function createCoachStream(
  attemptId: string,
  afterSequence: number,
  signal: AbortSignal,
): AsyncIterable<AiStreamEvent> {
  const events: AiStreamEvent[] = [
    { type: 'delta', sequence: 1, attemptId, text: 'Try a short walk after lunch.' },
    {
      type: 'citation',
      sequence: 2,
      attemptId,
      citation: { id: 'source-1', title: 'Activity evidence' },
    },
    {
      type: 'action',
      sequence: 3,
      attemptId,
      action: { id: `log-${attemptId}`, kind: 'log_metric', input: { value: 5 } },
    },
    {
      type: 'usage',
      sequence: 4,
      attemptId,
      usage: { inputTokens: 4, outputTokens: 8, remaining: 88 },
    },
    { type: 'complete', sequence: 5, attemptId },
  ]
  const pending = events.filter((event) => event.sequence > afterSequence)
  let index = 0
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (signal.aborted) {
            const error = new Error('Stopped')
            error.name = 'AbortError'
            throw error
          }
          const value = pending[index]
          index += 1
          return value ? { done: false, value } : { done: true, value: undefined }
        },
      }
    },
  }
}

function demoPhoto(): MediaAsset {
  return {
    uri: 'file:///coach-photo.jpg',
    name: 'coach-photo.jpg',
    mimeType: 'image/jpeg',
    kind: 'image',
    size: 10,
  }
}
