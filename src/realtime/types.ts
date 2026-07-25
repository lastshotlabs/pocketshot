import type { z } from 'zod'

export type RealtimeConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconciling'
  | 'backing_off'
  | 'paused'
  | 'stale'
  | 'closed'

export interface RealtimeEvent<T = unknown> {
  version: number
  channel: string
  id: string
  cursor: number
  type: string
  timestamp: string
  payload: T
}

export interface RealtimeSnapshot<TState> {
  version: number
  channel: string
  cursor: number
  state: TState
}

export interface RealtimeDiagnostics {
  state: RealtimeConnectionState
  reconnectAttempt: number
  lastCursor: number | null
  lastEventAt: number | null
  lastHeartbeatAt: number | null
  bufferedEvents: number
  duplicateEvents: number
  rejectedEvents: number
  gapRecoveries: number
  lastError: string | null
}

export interface RealtimeSchemas<TPayload, TState> {
  payload: z.ZodType<TPayload>
  state: z.ZodType<TState>
}

export interface RealtimeChannelStorage {
  loadCursor(channel: string): Promise<number | null>
  saveCursor(channel: string, cursor: number): Promise<void>
  clearCursor(channel: string): Promise<void>
}

export interface RealtimeSocket {
  readonly readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: ((event?: unknown) => void) | null
  onclose: ((event: { code: number; reason?: string }) => void) | null
}

export type RealtimeSocketFactory = (url: string) => RealtimeSocket

export interface RealtimeChannelOptions<TPayload, TState> {
  channel: string
  url: string
  schemas: RealtimeSchemas<TPayload, TState>
  getToken?: () => Promise<string | null>
  refreshAuth?: () => Promise<void>
  fetchSnapshot: (afterCursor: number | null) => Promise<RealtimeSnapshot<TState>>
  reduce: (state: TState, event: RealtimeEvent<TPayload>) => TState
  storage?: RealtimeChannelStorage
  socketFactory?: RealtimeSocketFactory
  heartbeatIntervalMs?: number
  heartbeatTimeoutMs?: number
  minReconnectDelayMs?: number
  maxReconnectDelayMs?: number
  reconnectJitter?: number
  maxBufferedEvents?: number
  supportedVersions?: readonly number[]
  now?: () => number
  random?: () => number
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void
}

export type RealtimeStateListener<TState> = (
  state: TState | null,
  diagnostics: RealtimeDiagnostics,
) => void

export interface RealtimeLifecycle {
  onForeground(callback: () => void): () => void
  onBackground(callback: () => void): () => void
}
