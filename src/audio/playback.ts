import type {
  AudioTrack,
  PlaybackControllerOptions,
  PlaybackSnapshot,
  RemotePlaybackCommand,
} from './types'

const initial: PlaybackSnapshot = {
  state: 'idle',
  track: null,
  positionMs: 0,
  durationMs: null,
  bufferedMs: null,
  rate: 1,
  error: null,
  ownerId: null,
}

export class PlaybackController {
  private snapshotValue: PlaybackSnapshot = { ...initial }
  private readonly listeners = new Set<(snapshot: PlaybackSnapshot) => void>()
  private unsubscribeStatus: (() => void) | null = null
  private unsubscribeCommands: (() => void) | null = null
  private leaseId: string | null = null
  private initialized = false
  private wasPlayingBeforeInterruption = false

  constructor(private readonly options: PlaybackControllerOptions) {}

  get snapshot(): PlaybackSnapshot {
    return { ...this.snapshotValue }
  }

  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => this.listeners.delete(listener)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    await this.options.adapter.configure({
      playsInSilentMode: this.options.playsInSilentMode ?? true,
      staysActiveInBackground: this.options.backgroundPolicy === 'continue',
      interruptionMode: 'pause',
    })
    this.unsubscribeStatus = this.options.adapter.subscribe((status) => {
      this.patch({
        positionMs: status.positionMs,
        durationMs: status.durationMs ?? this.snapshotValue.durationMs,
        bufferedMs: status.bufferedMs ?? this.snapshotValue.bufferedMs,
        state: status.error
          ? 'error'
          : status.ended
            ? 'ended'
            : status.playing
              ? 'playing'
              : this.snapshotValue.state === 'loading'
                ? 'ready'
                : this.snapshotValue.state,
        error: status.error ?? null,
      })
    })
    this.unsubscribeCommands = this.options.adapter.setRemoteCommandHandler((command) => {
      void this.handleRemoteCommand(command)
    })
    this.initialized = true
  }

  async load(track: AudioTrack): Promise<void> {
    await this.initialize()
    if (!track.playable) throw new Error('[pocketshot] Track is not playable')
    this.patch({
      state: 'loading',
      track,
      positionMs: 0,
      durationMs: track.durationMs ?? null,
      error: null,
    })
    try {
      await this.options.adapter.load(track)
      this.patch({ state: 'ready' })
    } catch (error) {
      this.patch({ state: 'error', error: message(error) })
      throw error
    }
  }

  async play(): Promise<void> {
    if (!this.snapshotValue.track) throw new Error('[pocketshot] Load a track before playback')
    await this.claimOwnership()
    await this.options.adapter.play()
    this.patch({ state: 'playing' })
  }

  async pause(): Promise<void> {
    await this.options.adapter.pause()
    this.patch({ state: 'paused' })
  }

  async stop(): Promise<void> {
    await this.options.adapter.stop()
    this.patch({ state: 'ready', positionMs: 0 })
    await this.releaseOwnership()
  }

  async seek(positionMs: number): Promise<void> {
    const maximum = this.snapshotValue.durationMs ?? Number.MAX_SAFE_INTEGER
    const position = Math.max(0, Math.min(positionMs, maximum))
    await this.options.adapter.seek(position)
    this.patch({ positionMs: position })
  }

  async onInterruption(started: boolean): Promise<void> {
    if (started) {
      this.wasPlayingBeforeInterruption = this.snapshotValue.state === 'playing'
      if (this.wasPlayingBeforeInterruption) await this.pause()
    } else if (this.wasPlayingBeforeInterruption && this.options.interruptionPolicy === 'resume') {
      this.wasPlayingBeforeInterruption = false
      await this.play()
    }
  }

  async onRouteChange(reason: 'headphones-disconnected' | 'bluetooth-disconnected' | 'other') {
    if (
      reason !== 'other' &&
      (this.options.routeLossPolicy ?? 'pause') === 'pause' &&
      this.snapshotValue.state === 'playing'
    ) {
      await this.pause()
    }
  }

  async onAppState(state: 'active' | 'background' | 'inactive'): Promise<void> {
    if (
      state !== 'active' &&
      this.options.backgroundPolicy === 'pause' &&
      this.snapshotValue.state === 'playing'
    ) {
      await this.pause()
    }
  }

  async destroy(): Promise<void> {
    await this.releaseOwnership()
    this.unsubscribeStatus?.()
    this.unsubscribeCommands?.()
    await this.options.adapter.unload()
    this.initialized = false
    this.patch({ ...initial })
  }

  private async claimOwnership(): Promise<void> {
    if (!this.options.ownership || !this.options.sessionId) {
      this.patch({ ownerId: this.options.deviceId })
      return
    }
    const lease = await this.options.ownership.claim({
      sessionId: this.options.sessionId,
      deviceId: this.options.deviceId,
    })
    if (lease.ownerId !== this.options.deviceId) {
      this.patch({ ownerId: lease.ownerId })
      throw new Error(`[pocketshot] Playback is controlled by ${lease.ownerId}`)
    }
    this.leaseId = lease.leaseId
    this.patch({ ownerId: lease.ownerId })
  }

  private async releaseOwnership(): Promise<void> {
    if (this.leaseId && this.options.ownership && this.options.sessionId) {
      await this.options.ownership.release({
        sessionId: this.options.sessionId,
        deviceId: this.options.deviceId,
        leaseId: this.leaseId,
      })
    }
    this.leaseId = null
    this.patch({ ownerId: null })
  }

  private async handleRemoteCommand(command: RemotePlaybackCommand): Promise<void> {
    if (command.type === 'play') await this.play()
    if (command.type === 'pause') await this.pause()
    if (command.type === 'stop') await this.stop()
    if (command.type === 'seek') await this.seek(command.positionMs)
  }

  private patch(patch: Partial<PlaybackSnapshot>): void {
    this.snapshotValue = { ...this.snapshotValue, ...patch }
    for (const listener of this.listeners) listener(this.snapshot)
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
