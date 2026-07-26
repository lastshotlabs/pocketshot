import type { AppStateManager } from '../app-state/manager'
import type { TokenStorage } from '../auth/storage'

type EventListener = (data: unknown, eventType: string) => void
interface NativeEventSource {
  addEventListener(type: string, cb: (event: { data: string; type: string }) => void): void
  close(): void
  readyState: number
}

interface SseManagerOptions {
  url: string
  tokenStorage: TokenStorage
  appStateManager: AppStateManager
  maxPayloadBytes?: number
  maxReconnectDelayMs?: number
}

/**
 * Manages a persistent SSE connection to a single endpoint.
 *
 * - Reconnects with exponential backoff on failure (1s → 2s → 4s → … → 30s cap)
 * - Pauses when the app goes to background, resumes on foreground
 * - Injects the auth token as a `token` query parameter
 * - Supports typed event listeners (event type → Set of callbacks)
 *
 * Optional peer dependency: react-native-sse
 * Install: npx expo install react-native-sse
 */
export class SseManager {
  private readonly url: string
  private readonly tokenStorage: TokenStorage
  private source: NativeEventSource | null = null
  private attachedEventTypes = new Set<string>()
  private listeners = new Map<string, Set<EventListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private stopped = false
  private foreground = true
  private connecting: Promise<void> | null = null
  private readonly maxPayloadBytes: number
  private readonly maxReconnectDelayMs: number
  private unsubForeground: (() => void) | null = null
  private unsubBackground: (() => void) | null = null

  constructor(opts: SseManagerOptions) {
    const url = new URL(opts.url)
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('[pocketshot] SSE endpoint must use HTTPS without credentials')
    }
    this.url = url.toString()
    this.tokenStorage = opts.tokenStorage
    this.maxPayloadBytes = opts.maxPayloadBytes ?? 256 * 1024
    this.maxReconnectDelayMs = opts.maxReconnectDelayMs ?? 30_000
    if (
      !Number.isInteger(this.maxPayloadBytes) ||
      this.maxPayloadBytes < 1 ||
      !Number.isFinite(this.maxReconnectDelayMs) ||
      this.maxReconnectDelayMs < 1
    ) {
      throw new Error('[pocketshot] SSE limits are invalid')
    }

    this.unsubForeground = opts.appStateManager.onForeground(() => {
      this.foreground = true
      if (!this.stopped) void this.connect()
    })
    this.unsubBackground = opts.appStateManager.onBackground(() => {
      this.foreground = false
      this.closeSource()
    })
  }

  async connect(): Promise<void> {
    if (this.stopped || !this.foreground) return
    if (this.connecting) return this.connecting
    this.connecting = this.open().finally(() => {
      this.connecting = null
    })
    return this.connecting
  }

  private async open(): Promise<void> {
    let EventSource: new (
      url: string,
      opts?: { headers?: Record<string, string> },
    ) => NativeEventSource

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      EventSource = (require('react-native-sse') as { default: typeof EventSource }).default
    } catch {
      throw new Error(
        '[pocketshot] SseManager requires react-native-sse.\nInstall it: npx expo install react-native-sse',
      )
    }

    this.closeSource()

    const token = await this.tokenStorage.getToken()
    if (this.stopped || !this.foreground) return
    const source = new EventSource(this.url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    source.addEventListener(
      'open' as never,
      (() => {
        this.reconnectDelay = 1000 // reset backoff on successful connect
      }) as never,
    )

    source.addEventListener(
      'error' as never,
      (() => {
        this.closeSource()
        if (!this.stopped) this.scheduleReconnect()
      }) as never,
    )

    // Wildcard message handler — dispatch to typed listeners
    source.addEventListener('message', (e: { data: string; type: string }) => {
      this.dispatch('message', e.data)
    })

    // Also capture any custom event types registered by listeners
    for (const eventType of this.listeners.keys()) {
      this.attachEventType(source, eventType)
    }

    this.source = source
  }

  /**
   * Subscribe to an SSE event type.
   * Use 'message' for generic events; use a named event type for typed streams.
   * @returns An unsubscribe function.
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!eventType.trim() || eventType.length > 100) {
      throw new Error('[pocketshot] SSE event type is invalid')
    }
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set())
    this.listeners.get(eventType)!.add(listener)
    if (this.source) this.attachEventType(this.source, eventType)
    return () => {
      this.listeners.get(eventType)?.delete(listener)
      if (!this.listeners.get(eventType)?.size) this.listeners.delete(eventType)
    }
  }

  private dispatch(eventType: string, rawData: string): void {
    const callbacks = this.listeners.get(eventType)
    if (!callbacks?.size) return
    if (new TextEncoder().encode(rawData).byteLength > this.maxPayloadBytes) return
    let parsed: unknown
    try {
      parsed = JSON.parse(rawData)
    } catch {
      parsed = rawData
    }
    for (const cb of callbacks) cb(parsed, eventType)
  }

  private closeSource(): void {
    if (this.source) {
      this.source.close()
      this.source = null
    }
    this.attachedEventTypes.clear()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopped) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect().catch(() => this.scheduleReconnect())
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelayMs)
  }

  private attachEventType(source: NativeEventSource, eventType: string): void {
    if (eventType === 'message' || this.attachedEventTypes.has(eventType)) return
    source.addEventListener(eventType, (event) => this.dispatch(eventType, event.data))
    this.attachedEventTypes.add(eventType)
  }

  /** Permanently close this manager and stop reconnection attempts. */
  destroy(): void {
    this.stopped = true
    this.closeSource()
    this.unsubForeground?.()
    this.unsubBackground?.()
    this.unsubForeground = null
    this.unsubBackground = null
    this.listeners.clear()
  }
}
