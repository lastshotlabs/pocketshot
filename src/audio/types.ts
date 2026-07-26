export interface AudioTrack {
  id: string
  provider: string
  title: string
  artist?: string
  artworkUrl?: string
  durationMs?: number
  previewUrl?: string
  playbackUrl?: string
  playable: boolean
  metadata?: Record<string, unknown>
}

export interface AudioCatalogAdapter {
  search(
    query: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<{
    tracks: AudioTrack[]
    nextCursor?: string
  }>
  get(id: string): Promise<AudioTrack>
  diagnostics(): Promise<{ available: boolean; authenticated: boolean; message?: string }>
}

export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export interface PlaybackSnapshot {
  state: PlaybackState
  track: AudioTrack | null
  positionMs: number
  durationMs: number | null
  bufferedMs: number | null
  rate: number
  error: string | null
  ownerId: string | null
}

export type RemotePlaybackCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'seek'; positionMs: number }
  | { type: 'next' }
  | { type: 'previous' }

export interface NativePlaybackAdapter {
  configure(options: {
    playsInSilentMode: boolean
    staysActiveInBackground: boolean
    interruptionMode: 'mix' | 'duck' | 'pause'
  }): Promise<void>
  load(track: AudioTrack): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  seek(positionMs: number): Promise<void>
  unload(): Promise<void>
  subscribe(
    listener: (status: {
      positionMs: number
      durationMs?: number
      bufferedMs?: number
      playing: boolean
      ended?: boolean
      error?: string
    }) => void,
  ): () => void
  setRemoteCommandHandler(handler: (command: RemotePlaybackCommand) => void): () => void
}

export interface PlaybackOwnershipAdapter {
  claim(input: { sessionId: string; deviceId: string }): Promise<{
    ownerId: string
    leaseId: string
    expiresAt?: string
  }>
  renew?(input: {
    sessionId: string
    deviceId: string
    leaseId: string
  }): Promise<{ ownerId: string; leaseId: string; expiresAt?: string }>
  release(input: { sessionId: string; deviceId: string; leaseId: string }): Promise<void>
}

export interface PlaybackControllerOptions {
  adapter: NativePlaybackAdapter
  deviceId: string
  sessionId?: string
  ownership?: PlaybackOwnershipAdapter
  backgroundPolicy?: 'continue' | 'pause'
  interruptionPolicy?: 'resume' | 'stay-paused'
  routeLossPolicy?: 'pause' | 'continue'
  playsInSilentMode?: boolean
  /** Handles lock-screen queue navigation without coupling the controller to an app queue. */
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  /** Receives asynchronous native/remote/ownership failures. */
  onError?: (error: unknown) => void
  /** Converts errors into bounded, privacy-safe snapshot text. */
  sanitizeError?: (error: unknown) => string
  /** Ownership lease renewal cadence when the adapter supports renewal. Default: 15 seconds. */
  ownershipRenewIntervalMs?: number
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void
}

export interface PairingToken {
  id: string
  code: string
  qrPayload: string
  expiresAt: string
  status: 'pending' | 'claimed' | 'expired' | 'revoked'
  claimedDeviceId?: string
}

export interface PairingAdapter {
  create(input: { sessionId: string; role: 'controller' | 'display' }): Promise<PairingToken>
  get(id: string): Promise<PairingToken>
  revoke(id: string): Promise<void>
}

export interface PublicSecondScreenEnvelope<T> {
  schemaVersion: 1
  sessionId: string
  sequence: number
  state: T
}
