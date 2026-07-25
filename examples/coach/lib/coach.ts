import {
  AiConversationController,
  AiMemoryController,
  createMemoryAiStorage,
  type AiConversation,
  type AiMemoryFact,
  type AiStreamEvent,
} from '@lastshotlabs/pocketshot/ai'
import {
  MediaPipelineController,
  createMemoryMediaStorage,
  type MediaCaptureAdapter,
  type MediaAsset,
} from '@lastshotlabs/pocketshot/media'

export interface CoachState {
  ready: boolean
  conversation: AiConversation | null
  logs: { id: string; value: number; undone: boolean }[]
  mediaStatus: string | null
  memory: AiMemoryFact[]
  exportStatus: 'idle' | 'requested' | 'ready'
  error: string | null
}

export class CoachDemoController {
  private attempt = 0
  private mediaId = 0
  private stateValue: CoachState = {
    ready: false,
    conversation: null,
    logs: [],
    mediaStatus: null,
    memory: [],
    exportStatus: 'idle',
    error: null,
  }
  private readonly listeners = new Set<(state: CoachState) => void>()

  readonly ai = new AiConversationController({
    storage: createMemoryAiStorage(),
    transport: {
      createAttempt: async () => {
        this.attempt += 1
        return {
          attemptId: `attempt-${this.attempt}`,
          userMessageId: `user-${this.attempt}`,
          assistantMessageId: `assistant-${this.attempt}`,
        }
      },
      stream: ({ attemptId, afterSequence, signal }) =>
        this.stream(attemptId, afterSequence, signal),
      cancel: async () => undefined,
    },
    actions: {
      commit: async (action) => {
        const value = Number((action.input as { value?: number }).value ?? 0)
        this.stateValue.logs.push({ id: action.id, value, undone: false })
        this.emit()
        return { logId: action.id }
      },
      reject: async () => undefined,
      undo: async (action) => {
        this.stateValue.logs = this.stateValue.logs.map((log) =>
          log.id === action.id ? { ...log, undone: true } : log,
        )
        this.emit()
        return { undone: true }
      },
    },
  })

  readonly media
  constructor(
    capture: MediaCaptureAdapter = {
      requestPermission: async () => ({ state: 'granted', canAskAgain: true }),
      acquire: async () => this.photo(),
    },
  ) {
    this.media = new MediaPipelineController({
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
      createId: () => `media-${++this.mediaId}`,
      wait: async () => undefined,
    })
  }

  private facts: AiMemoryFact[] = []
  readonly memory = new AiMemoryController({
    list: async () => this.facts,
    create: async (input) => {
      const fact = {
        ...input,
        id: `fact-${this.facts.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.facts.push(fact)
      return fact
    },
    update: async (id, patch) => {
      const current = this.facts.find((fact) => fact.id === id)!
      const fact = { ...current, ...patch, updatedAt: new Date().toISOString() }
      this.facts = this.facts.map((item) => (item.id === id ? fact : item))
      return fact
    },
    remove: async (id) => {
      this.facts = this.facts.filter((fact) => fact.id !== id)
    },
  })

  get state(): CoachState {
    return JSON.parse(JSON.stringify(this.stateValue)) as CoachState
  }

  subscribe(listener: (state: CoachState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  async initialize(): Promise<void> {
    this.stateValue.conversation = await this.ai.create('Daily coaching')
    this.stateValue.ready = true
    this.emit()
  }

  async ask(message: string): Promise<void> {
    if (!this.stateValue.conversation) throw new Error('Not initialized')
    try {
      this.stateValue.conversation = await this.ai.send(this.stateValue.conversation.id, message)
      this.stateValue.error = null
    } catch (error) {
      this.stateValue.error = error instanceof Error ? error.message : String(error)
    }
    this.emit()
  }

  async confirmLatestAction(value = 8): Promise<void> {
    const conversation = this.stateValue.conversation!
    const action = conversation.messages[conversation.messages.length - 1]?.actions[0]
    if (!action) return
    await this.ai.confirmAction(conversation.id, action.id, { value })
    this.stateValue.conversation = this.ai.get(conversation.id)
    this.emit()
  }

  async undoLatestAction(): Promise<void> {
    const conversation = this.stateValue.conversation!
    const action = conversation.messages[conversation.messages.length - 1]?.actions[0]
    if (!action) return
    await this.ai.undoAction(conversation.id, action.id)
    this.stateValue.conversation = this.ai.get(conversation.id)
    this.emit()
  }

  async analyzePhoto(): Promise<void> {
    const media = await this.media.acquire('camera')
    if (!media) return
    this.stateValue.mediaStatus = 'uploading'
    this.emit()
    const result = await this.media.run(media.id)
    this.stateValue.mediaStatus =
      result.status === 'complete' ? 'Balanced meal · analysis complete' : result.status
    this.emit()
  }

  async remember(content: string): Promise<void> {
    await this.memory.create({ content, trusted: true, source: 'user' })
    this.stateValue.memory = this.memory.list()
    this.emit()
  }

  requestExport(): void {
    this.stateValue.exportStatus = 'requested'
    this.emit()
    void Promise.resolve().then(() => {
      this.stateValue.exportStatus = 'ready'
      this.emit()
    })
  }

  private stream(
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

  private photo(): MediaAsset {
    return {
      uri: 'file:///coach-photo.jpg',
      name: 'coach-photo.jpg',
      mimeType: 'image/jpeg',
      kind: 'image',
      size: 10,
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }
}
