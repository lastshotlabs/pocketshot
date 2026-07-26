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
  private initializePromise: Promise<void> | null = null
  private wasPlayingBeforeInterruption = false
  private ownershipRenewTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly options: PlaybackControllerOptions) {}

  get snapshot(): PlaybackSnapshot {
    return {
      ...this.snapshotValue,
      track: this.snapshotValue.track ? cloneTrack(this.snapshotValue.track) : null,
    }
  }

  subscribe(listener: (snapshot: PlaybackSnapshot) => void): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => this.listeners.delete(listener)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initializePromise ??= (async () => {
      await this.options.adapter.configure({
        playsInSilentMode: this.options.playsInSilentMode ?? true,
        staysActiveInBackground: this.options.backgroundPolicy === 'continue',
        interruptionMode: 'pause',
      })
      this.unsubscribeStatus = this.options.adapter.subscribe((status) => {
        const positionMs = finiteNonNegative(status.positionMs, this.snapshotValue.positionMs)
        const durationMs =
          status.durationMs === undefined
            ? this.snapshotValue.durationMs
            : finiteNonNegative(status.durationMs, this.snapshotValue.durationMs)
        const bufferedMs =
          status.bufferedMs === undefined
            ? this.snapshotValue.bufferedMs
            : finiteNonNegative(status.bufferedMs, this.snapshotValue.bufferedMs)
        this.patch({
          positionMs,
          durationMs,
          bufferedMs,
          state: status.error
            ? 'error'
            : status.ended
              ? 'ended'
              : status.playing
                ? 'playing'
                : this.snapshotValue.state === 'loading'
                  ? 'ready'
                  : this.snapshotValue.state,
          error: status.error ? this.safeError(status.error) : null,
        })
        if (status.error || status.ended) {
          void this.releaseOwnership().catch((error) => this.reportError(error))
        }
      })
      this.unsubscribeCommands = this.options.adapter.setRemoteCommandHandler((command) => {
        void this.handleRemoteCommand(command).catch((error) => this.reportError(error))
      })
      this.initialized = true
    })().finally(() => {
      this.initializePromise = null
    })
    return this.initializePromise
  }

  async load(track: AudioTrack): Promise<void> {
    await this.initialize()
    if (!track.playable) throw new Error('[pocketshot] Track is not playable')
    if (!track.id.trim() || !track.provider.trim() || !track.title.trim()) {
      throw new Error('[pocketshot] Track identity and title are required')
    }
    if (this.snapshotValue.track?.id !== track.id) await this.releaseOwnership()
    this.patch({
      state: 'loading',
      track: cloneTrack(track),
      positionMs: 0,
      durationMs: track.durationMs ?? null,
      error: null,
    })
    try {
      await this.options.adapter.load(track)
      this.patch({ state: 'ready' })
    } catch (error) {
      this.patch({ state: 'error', error: this.safeError(error) })
      throw error
    }
  }

  async play(): Promise<void> {
    if (!this.snapshotValue.track) throw new Error('[pocketshot] Load a track before playback')
    await this.claimOwnership()
    try {
      await this.options.adapter.play()
      this.patch({ state: 'playing', error: null })
    } catch (error) {
      await this.releaseOwnership().catch((releaseError) => this.reportError(releaseError))
      this.patch({ state: 'error', error: this.safeError(error) })
      throw error
    }
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
    if (!Number.isFinite(positionMs)) throw new RangeError('[pocketshot] Seek must be finite')
    const maximum = this.snapshotValue.durationMs ?? Number.MAX_SAFE_INTEGER
    const position = Math.max(0, Math.min(positionMs, maximum))
    await this.options.adapter.seek(position)
    this.patch({ positionMs: position })
  }

  async onInterruption(started: boolean): Promise<void> {
    if (started) {
      this.wasPlayingBeforeInterruption = this.snapshotValue.state === 'playing'
      if (this.wasPlayingBeforeInterruption) await this.pause()
    } else {
      const shouldResume =
        this.wasPlayingBeforeInterruption && this.options.interruptionPolicy === 'resume'
      this.wasPlayingBeforeInterruption = false
      if (shouldResume) await this.play()
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
    this.unsubscribeStatus?.()
    this.unsubscribeCommands?.()
    this.unsubscribeStatus = null
    this.unsubscribeCommands = null
    this.cancelOwnershipRenewal()
    const cleanup = await Promise.allSettled([
      this.releaseOwnership(),
      this.options.adapter.unload(),
    ])
    this.initialized = false
    this.patch({ ...initial })
    const failure = cleanup.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    if (failure) throw failure.reason
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
    this.scheduleOwnershipRenewal()
  }

  private async releaseOwnership(): Promise<void> {
    this.cancelOwnershipRenewal()
    const leaseId = this.leaseId
    try {
      if (leaseId && this.options.ownership && this.options.sessionId) {
        await this.options.ownership.release({
          sessionId: this.options.sessionId,
          deviceId: this.options.deviceId,
          leaseId,
        })
      }
    } finally {
      this.leaseId = null
      this.patch({ ownerId: null })
    }
  }

  private async handleRemoteCommand(command: RemotePlaybackCommand): Promise<void> {
    if (command.type === 'play') await this.play()
    if (command.type === 'pause') await this.pause()
    if (command.type === 'stop') await this.stop()
    if (command.type === 'seek') await this.seek(command.positionMs)
    if (command.type === 'next') await this.options.onNext?.()
    if (command.type === 'previous') await this.options.onPrevious?.()
  }

  private scheduleOwnershipRenewal(): void {
    this.cancelOwnershipRenewal()
    if (!this.options.ownership?.renew || !this.leaseId || !this.options.sessionId) return
    this.ownershipRenewTimer = (this.options.setTimer ?? setTimeout)(() => {
      this.ownershipRenewTimer = null
      void this.renewOwnership()
    }, this.options.ownershipRenewIntervalMs ?? 15_000)
  }

  private async renewOwnership(): Promise<void> {
    if (!this.options.ownership?.renew || !this.leaseId || !this.options.sessionId) return
    try {
      const lease = await this.options.ownership.renew({
        sessionId: this.options.sessionId,
        deviceId: this.options.deviceId,
        leaseId: this.leaseId,
      })
      if (lease.ownerId !== this.options.deviceId) {
        await this.options.adapter.pause()
        this.leaseId = null
        this.patch({ state: 'paused', ownerId: lease.ownerId })
        return
      }
      this.leaseId = lease.leaseId
      this.scheduleOwnershipRenewal()
    } catch (error) {
      await this.options.adapter.pause().catch(() => undefined)
      this.leaseId = null
      this.patch({ state: 'paused', ownerId: null, error: this.safeError(error) })
      this.reportError(error)
    }
  }

  private cancelOwnershipRenewal(): void {
    if (this.ownershipRenewTimer) {
      ;(this.options.clearTimer ?? clearTimeout)(this.ownershipRenewTimer)
    }
    this.ownershipRenewTimer = null
  }

  private safeError(error: unknown): string {
    const value = (
      this.options.sanitizeError?.(error) ??
      (error instanceof Error ? error.name : 'Playback failure')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (value || 'Playback failure').slice(0, 160)
  }

  private reportError(error: unknown): void {
    this.options.onError?.(error)
  }

  private patch(patch: Partial<PlaybackSnapshot>): void {
    this.snapshotValue = { ...this.snapshotValue, ...patch }
    for (const listener of this.listeners) listener(this.snapshot)
  }
}

function cloneTrack(track: AudioTrack): AudioTrack {
  return JSON.parse(JSON.stringify(track)) as AudioTrack
}

function finiteNonNegative(value: number, fallback: number): number
function finiteNonNegative(value: number, fallback: number | null): number | null
function finiteNonNegative(value: number, fallback: number | null): number | null {
  return Number.isFinite(value) && value >= 0 ? value : fallback
}
