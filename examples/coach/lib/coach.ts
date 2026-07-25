import {
  type AiConversation,
  type AiMemoryFact,
} from '@lastshotlabs/pocketshot/ai'
import {
  type MediaCaptureAdapter,
} from '@lastshotlabs/pocketshot/media'
import {
  createCoachConversation,
  createCoachMedia,
  createCoachMemory,
  defaultCoachCapture,
} from './coach-services'

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

  readonly ai = createCoachConversation({
    commit: (id, value) => {
      this.stateValue.logs.push({ id, value, undone: false })
      this.emit()
    },
    undo: (id) => {
      this.stateValue.logs = this.stateValue.logs.map((log) =>
        log.id === id ? { ...log, undone: true } : log,
      )
      this.emit()
    },
  })

  readonly media
  constructor(capture: MediaCaptureAdapter = defaultCoachCapture()) {
    this.media = createCoachMedia(capture)
  }

  private facts: AiMemoryFact[] = []
  readonly memory = createCoachMemory(this.facts)

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

  private emit(): void {
    for (const listener of this.listeners) listener(this.state)
  }
}
