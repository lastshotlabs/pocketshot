import { createRealtimeEventSchema, createRealtimeSnapshotSchema } from './schema'
import { RealtimeReconciler } from './reconciler'
import type {
  RealtimeChannelOptions,
  RealtimeConnectionState,
  RealtimeDiagnostics,
  RealtimeEvent,
  RealtimeSocket,
  RealtimeStateListener,
  RealtimeLifecycle,
} from './types'

const SOCKET_OPEN = 1

type ServerControlFrame =
  | { type: 'pong' }
  | { type: 'auth_expired' }
  | { type: 'reset'; reason?: string }

export class RealtimeChannel<TPayload, TState> {
  private readonly reconciler: RealtimeReconciler<TPayload, TState>
  private readonly eventSchema
  private readonly snapshotSchema
  private readonly listeners = new Set<RealtimeStateListener<TState>>()
  private socket: RealtimeSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatDeadlineTimer: ReturnType<typeof setTimeout> | null = null
  private connectionGeneration = 0
  private reconnectAttempt = 0
  private started = false
  private paused = false
  private reconciling: Promise<void> | null = null
  private diagnosticsValue: RealtimeDiagnostics = {
    state: 'idle',
    reconnectAttempt: 0,
    lastCursor: null,
    lastEventAt: null,
    lastHeartbeatAt: null,
    bufferedEvents: 0,
    duplicateEvents: 0,
    rejectedEvents: 0,
    gapRecoveries: 0,
    lastError: null,
  }

  constructor(private readonly options: RealtimeChannelOptions<TPayload, TState>) {
    this.reconciler = new RealtimeReconciler(options.reduce, options.maxBufferedEvents ?? 256)
    this.eventSchema = createRealtimeEventSchema(options.schemas.payload)
    this.snapshotSchema = createRealtimeSnapshotSchema(options.schemas.state)
  }

  get state(): TState | null {
    return this.reconciler.state
  }

  get diagnostics(): Readonly<RealtimeDiagnostics> {
    return { ...this.diagnosticsValue }
  }

  subscribe(listener: RealtimeStateListener<TState>): () => void {
    this.listeners.add(listener)
    listener(this.reconciler.state, this.diagnostics)
    return () => this.listeners.delete(listener)
  }

  async start(): Promise<void> {
    if (this.started && !this.paused) return
    this.started = true
    this.paused = false
    const persistedCursor = await this.options.storage?.loadCursor(this.options.channel)
    if (persistedCursor !== undefined && persistedCursor !== null) {
      this.patchDiagnostics({ lastCursor: persistedCursor })
    }
    await this.reconcile('start')
    await this.connect()
  }

  pause(): void {
    if (!this.started || this.paused) return
    this.paused = true
    this.cancelReconnect()
    this.closeSocket(1000, 'background')
    this.setConnectionState('paused')
  }

  async resume(): Promise<void> {
    if (!this.started) return this.start()
    if (!this.paused) return
    this.paused = false
    await this.reconcile('resume')
    await this.connect()
  }

  stop(): void {
    this.started = false
    this.paused = false
    this.connectionGeneration += 1
    this.cancelReconnect()
    this.closeSocket(1000, 'stopped')
    this.setConnectionState('closed')
    this.listeners.clear()
  }

  async forceReconcile(): Promise<void> {
    await this.reconcile('manual')
  }

  private async connect(): Promise<void> {
    if (!this.started || this.paused || this.socket) return
    const generation = ++this.connectionGeneration
    this.setConnectionState('connecting')

    try {
      const token = await this.options.getToken?.()
      if (generation !== this.connectionGeneration || !this.started || this.paused) return
      const url = new URL(this.options.url)
      url.searchParams.set('channel', this.options.channel)
      const cursor = this.reconciler.cursor ?? this.diagnosticsValue.lastCursor
      if (cursor !== null) url.searchParams.set('cursor', String(cursor))

      const socket = this.createSocket(url.toString())
      this.socket = socket
      socket.onopen = () => {
        if (this.socket !== socket) return
        this.reconnectAttempt = 0
        this.patchDiagnostics({ reconnectAttempt: 0, lastError: null })
        this.setConnectionState('connected')
        if (token) this.send({ type: 'authenticate', token })
        this.send({ type: 'subscribe', channel: this.options.channel, cursor })
        this.scheduleHeartbeat()
      }
      socket.onmessage = (event) => {
        if (this.socket === socket) void this.handleMessage(event.data)
      }
      socket.onerror = () => {
        if (this.socket !== socket) return
        this.failConnection('WebSocket transport error')
      }
      socket.onclose = (event) => {
        if (this.socket !== socket) return
        this.socket = null
        this.cancelHeartbeat()
        if (event.code === 1000 || !this.started || this.paused) return
        this.scheduleReconnect(`WebSocket closed (${event.code})`)
      }
    } catch (error) {
      if (generation !== this.connectionGeneration) return
      this.scheduleReconnect(this.errorMessage(error))
    }
  }

  private async handleMessage(raw: unknown): Promise<void> {
    let decoded: unknown
    try {
      decoded = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      this.reject('Malformed realtime JSON')
      return
    }

    if (this.isControlFrame(decoded)) {
      if (decoded.type === 'pong') {
        this.patchDiagnostics({ lastHeartbeatAt: this.now() })
        this.clearHeartbeatDeadline()
        this.scheduleHeartbeat()
      } else if (decoded.type === 'auth_expired') {
        await this.options.refreshAuth?.()
        this.failConnection('Authentication expired')
      } else {
        await this.reconcile(decoded.reason ?? 'server reset')
      }
      return
    }

    const parsed = this.eventSchema.safeParse(decoded)
    if (
      !parsed.success ||
      parsed.data.channel !== this.options.channel ||
      !this.supportsVersion(parsed.data.version)
    ) {
      this.reject('Rejected realtime event schema, version, or channel')
      return
    }

    const event = parsed.data
    const result = this.reconciler.push(event)
    if (result.duplicate) {
      this.patchDiagnostics({
        duplicateEvents: this.diagnosticsValue.duplicateEvents + 1,
        bufferedEvents: this.reconciler.bufferedCount,
      })
      return
    }

    this.patchDiagnostics({
      lastEventAt: this.now(),
      lastCursor: result.cursor,
      bufferedEvents: this.reconciler.bufferedCount,
    })
    if (result.cursor !== null && result.applied.length > 0) {
      await this.options.storage?.saveCursor(this.options.channel, result.cursor)
      this.emit()
    }
    if (result.gap || result.overflow) {
      await this.reconcile(result.overflow ? 'buffer overflow' : 'cursor gap')
    }
  }

  private async reconcile(reason: string): Promise<void> {
    if (this.reconciling) return this.reconciling
    const previousState = this.diagnosticsValue.state
    this.setConnectionState('reconciling')
    this.reconciling = (async () => {
      try {
        const afterCursor = this.reconciler.cursor ?? this.diagnosticsValue.lastCursor
        const snapshot = this.snapshotSchema.parse(await this.options.fetchSnapshot(afterCursor))
        if (snapshot.channel !== this.options.channel) {
          throw new Error(`Snapshot channel mismatch: ${snapshot.channel}`)
        }
        if (!this.supportsVersion(snapshot.version)) {
          throw new Error(`Unsupported realtime snapshot version: ${snapshot.version}`)
        }
        const result = this.reconciler.applySnapshot(snapshot)
        await this.options.storage?.saveCursor(this.options.channel, snapshot.cursor)
        this.patchDiagnostics({
          lastCursor: result.cursor,
          bufferedEvents: this.reconciler.bufferedCount,
          gapRecoveries:
            reason === 'start'
              ? this.diagnosticsValue.gapRecoveries
              : this.diagnosticsValue.gapRecoveries + 1,
          lastError: null,
        })
        this.emit()
      } catch (error) {
        this.patchDiagnostics({ lastError: this.errorMessage(error) })
        this.setConnectionState('stale')
        throw error
      } finally {
        this.reconciling = null
      }
    })()

    try {
      await this.reconciling
      if (this.started && !this.paused) {
        this.setConnectionState(
          this.socket?.readyState === SOCKET_OPEN ? 'connected' : previousState,
        )
      }
    } catch {
      if (this.started && !this.paused && previousState !== 'idle') this.scheduleReconnect(reason)
    }
  }

  private scheduleHeartbeat(): void {
    this.cancelHeartbeat()
    this.heartbeatTimer = this.setTimer(() => {
      this.heartbeatTimer = null
      if (this.socket?.readyState !== SOCKET_OPEN) return
      this.send({ type: 'ping', at: this.now() })
      this.heartbeatDeadlineTimer = this.setTimer(() => {
        this.heartbeatDeadlineTimer = null
        this.failConnection('Heartbeat timeout')
      }, this.options.heartbeatTimeoutMs ?? 10_000)
    }, this.options.heartbeatIntervalMs ?? 25_000)
  }

  private scheduleReconnect(error: string): void {
    if (!this.started || this.paused || this.reconnectTimer) return
    this.closeSocket()
    this.reconnectAttempt += 1
    const min = this.options.minReconnectDelayMs ?? 1_000
    const max = this.options.maxReconnectDelayMs ?? 30_000
    const jitter = this.options.reconnectJitter ?? 0.2
    const base = Math.min(max, min * 2 ** (this.reconnectAttempt - 1))
    const factor = 1 - jitter + this.random() * jitter * 2
    const delay = Math.max(0, Math.round(base * factor))
    this.patchDiagnostics({
      state: 'backing_off',
      reconnectAttempt: this.reconnectAttempt,
      lastError: error,
    })
    this.reconnectTimer = this.setTimer(() => {
      this.reconnectTimer = null
      void this.connect()
    }, delay)
  }

  private failConnection(error: string): void {
    this.scheduleReconnect(error)
  }

  private reject(error: string): void {
    this.patchDiagnostics({
      rejectedEvents: this.diagnosticsValue.rejectedEvents + 1,
      lastError: error,
    })
  }

  private createSocket(url: string): RealtimeSocket {
    if (this.options.socketFactory) return this.options.socketFactory(url)
    return new WebSocket(url) as unknown as RealtimeSocket
  }

  private send(frame: unknown): void {
    if (this.socket?.readyState === SOCKET_OPEN) this.socket.send(JSON.stringify(frame))
  }

  private closeSocket(code?: number, reason?: string): void {
    const socket = this.socket
    this.socket = null
    this.cancelHeartbeat()
    if (socket) socket.close(code, reason)
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) this.clearTimer(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private cancelHeartbeat(): void {
    if (this.heartbeatTimer) this.clearTimer(this.heartbeatTimer)
    this.heartbeatTimer = null
    this.clearHeartbeatDeadline()
  }

  private clearHeartbeatDeadline(): void {
    if (this.heartbeatDeadlineTimer) this.clearTimer(this.heartbeatDeadlineTimer)
    this.heartbeatDeadlineTimer = null
  }

  private setConnectionState(state: RealtimeConnectionState): void {
    this.patchDiagnostics({ state })
  }

  private patchDiagnostics(patch: Partial<RealtimeDiagnostics>): void {
    this.diagnosticsValue = { ...this.diagnosticsValue, ...patch }
    this.emit()
  }

  private emit(): void {
    const diagnostics = this.diagnostics
    for (const listener of this.listeners) listener(this.reconciler.state, diagnostics)
  }

  private isControlFrame(value: unknown): value is ServerControlFrame {
    if (!value || typeof value !== 'object' || !('type' in value)) return false
    const type = (value as { type?: unknown }).type
    return type === 'pong' || type === 'auth_expired' || type === 'reset'
  }

  private supportsVersion(version: number): boolean {
    return (this.options.supportedVersions ?? [1]).includes(version)
  }

  private now(): number {
    return (this.options.now ?? Date.now)()
  }

  private random(): number {
    return (this.options.random ?? Math.random)()
  }

  private setTimer(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    return (this.options.setTimer ?? setTimeout)(callback, delay)
  }

  private clearTimer(timer: ReturnType<typeof setTimeout>): void {
    ;(this.options.clearTimer ?? clearTimeout)(timer)
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }
}

export function createRealtimeChannel<TPayload, TState>(
  options: RealtimeChannelOptions<TPayload, TState>,
): RealtimeChannel<TPayload, TState> {
  return new RealtimeChannel(options)
}

/**
 * Binds a channel to PocketShot's shared native lifecycle manager.
 * The returned cleanup function removes both subscriptions without stopping
 * the channel, allowing owners to choose whether the channel is reused.
 */
export function bindRealtimeLifecycle<TPayload, TState>(
  channel: RealtimeChannel<TPayload, TState>,
  appStateManager: RealtimeLifecycle,
): () => void {
  const unsubscribeBackground = appStateManager.onBackground(() => channel.pause())
  const unsubscribeForeground = appStateManager.onForeground(() => {
    void channel.resume()
  })
  return () => {
    unsubscribeBackground()
    unsubscribeForeground()
  }
}
