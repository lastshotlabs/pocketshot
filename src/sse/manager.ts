import type { AppStateManager } from '../app-state/manager'
import type { TokenStorage } from '../auth/storage'

type EventListener = (data: unknown, eventType: string) => void

interface SseManagerOptions {
  url: string
  tokenStorage: TokenStorage
  appStateManager: AppStateManager
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
  private source: unknown = null // EventSource from react-native-sse
  private listeners = new Map<string, Set<EventListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private stopped = false
  private unsubForeground: (() => void) | null = null
  private unsubBackground: (() => void) | null = null

  constructor(opts: SseManagerOptions) {
    this.url = opts.url
    this.tokenStorage = opts.tokenStorage

    this.unsubForeground = opts.appStateManager.onForeground(() => {
      if (!this.stopped) void this.connect()
    })
    this.unsubBackground = opts.appStateManager.onBackground(() => {
      this.closeSource()
    })
  }

  async connect(): Promise<void> {
    let EventSource: new (url: string, opts?: { headers?: Record<string, string> }) => {
      addEventListener(type: string, cb: (e: { data: string; type: string }) => void): void
      close(): void
      readyState: number
    }

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
    const u = new URL(this.url)
    if (token) u.searchParams.set('token', token)

    const source = new EventSource(u.toString())

    source.addEventListener('open' as never, (() => {
      this.reconnectDelay = 1000 // reset backoff on successful connect
    }) as never)

    source.addEventListener('error' as never, (() => {
      this.closeSource()
      if (!this.stopped) this.scheduleReconnect()
    }) as never)

    // Wildcard message handler — dispatch to typed listeners
    source.addEventListener('message', (e: { data: string; type: string }) => {
      this.dispatch('message', e.data)
    })

    // Also capture any custom event types registered by listeners
    for (const eventType of this.listeners.keys()) {
      if (eventType !== 'message') {
        source.addEventListener(eventType, (e: { data: string; type: string }) => {
          this.dispatch(eventType, e.data)
        })
      }
    }

    this.source = source
  }

  /**
   * Subscribe to an SSE event type.
   * Use 'message' for generic events; use a named event type for typed streams.
   * @returns An unsubscribe function.
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set())
    this.listeners.get(eventType)!.add(listener)
    return () => {
      this.listeners.get(eventType)?.delete(listener)
      if (!this.listeners.get(eventType)?.size) this.listeners.delete(eventType)
    }
  }

  private dispatch(eventType: string, rawData: string): void {
    const callbacks = this.listeners.get(eventType)
    if (!callbacks?.size) return
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
      ;(this.source as { close(): void }).close()
      this.source = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopped) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
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
