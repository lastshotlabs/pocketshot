import { describe, expect, it, vi } from 'vitest'
import {
  PairingController,
  PlaybackController,
  SecondScreenProjector,
  type AudioTrack,
  type NativePlaybackAdapter,
  type RemotePlaybackCommand,
} from '../../src/audio'

const track: AudioTrack = {
  id: 'track-1',
  provider: 'test',
  title: 'Song',
  durationMs: 10_000,
  playable: true,
}

function nativeAdapter() {
  let statusListener:
    | ((status: { positionMs: number; playing: boolean; ended?: boolean }) => void)
    | null = null
  let commandListener: ((command: RemotePlaybackCommand) => void) | null = null
  const adapter: NativePlaybackAdapter = {
    configure: vi.fn(async () => undefined),
    load: vi.fn(async () => undefined),
    play: vi.fn(async () => undefined),
    pause: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    seek: vi.fn(async () => undefined),
    unload: vi.fn(async () => undefined),
    subscribe: vi.fn((listener) => {
      statusListener = listener
      return () => {
        statusListener = null
      }
    }),
    setRemoteCommandHandler: vi.fn((listener) => {
      commandListener = listener
      return () => {
        commandListener = null
      }
    }),
  }
  return {
    adapter,
    status: (value: { positionMs: number; playing: boolean; ended?: boolean }) =>
      statusListener?.(value),
    command: (value: RemotePlaybackCommand) => commandListener?.(value),
  }
}

describe('PlaybackController', () => {
  it('coalesces concurrent native initialization', async () => {
    const native = nativeAdapter()
    let release!: () => void
    ;(native.adapter.configure as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
    })
    const first = playback.initialize()
    const second = playback.initialize()
    expect(native.adapter.configure).toHaveBeenCalledOnce()
    release()
    await Promise.all([first, second])
    expect(native.adapter.subscribe).toHaveBeenCalledOnce()
  })

  it('loads, claims ownership, plays, seeks, and releases cleanly', async () => {
    const native = nativeAdapter()
    const ownership = {
      claim: vi.fn(async () => ({ ownerId: 'phone-1', leaseId: 'lease-1' })),
      release: vi.fn(async () => undefined),
    }
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      sessionId: 'party-1',
      ownership,
      backgroundPolicy: 'continue',
    })
    await playback.load(track)
    await playback.play()
    await playback.seek(20_000)
    native.status({ positionMs: 10_000, playing: false, ended: true })
    await playback.stop()

    expect(playback.snapshot).toMatchObject({ state: 'ready', positionMs: 0, ownerId: null })
    expect(native.adapter.seek).toHaveBeenCalledWith(10_000)
    expect(ownership.release).toHaveBeenCalledWith({
      sessionId: 'party-1',
      deviceId: 'phone-1',
      leaseId: 'lease-1',
    })
  })

  it('refuses playback when another device owns the session', async () => {
    const native = nativeAdapter()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      sessionId: 'party-1',
      ownership: {
        claim: async () => ({ ownerId: 'tv-1', leaseId: 'lease-tv' }),
        release: async () => undefined,
      },
    })
    await playback.load(track)
    await expect(playback.play()).rejects.toThrow('controlled by tv-1')
    expect(native.adapter.play).not.toHaveBeenCalled()
  })

  it('pauses and optionally resumes around calls and alarms', async () => {
    const native = nativeAdapter()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      interruptionPolicy: 'resume',
    })
    await playback.load(track)
    await playback.play()
    await playback.onInterruption(true)
    expect(playback.snapshot.state).toBe('paused')
    await playback.onInterruption(false)
    expect(playback.snapshot.state).toBe('playing')
    expect(native.adapter.play).toHaveBeenCalledTimes(2)
  })

  it('pauses on headphone loss and background according to policy', async () => {
    const native = nativeAdapter()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      backgroundPolicy: 'pause',
      routeLossPolicy: 'pause',
    })
    await playback.load(track)
    await playback.play()
    await playback.onRouteChange('headphones-disconnected')
    expect(playback.snapshot.state).toBe('paused')
    await playback.play()
    await playback.onAppState('background')
    expect(playback.snapshot.state).toBe('paused')
  })

  it('routes lock-screen/media commands through the same state machine', async () => {
    const native = nativeAdapter()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
    })
    await playback.load(track)
    native.command({ type: 'play' })
    await vi.waitFor(() => expect(playback.snapshot.state).toBe('playing'))
    native.command({ type: 'seek', positionMs: 2_000 })
    await vi.waitFor(() => expect(playback.snapshot.positionMs).toBe(2_000))
  })

  it('routes next and previous commands and reports asynchronous failures', async () => {
    const native = nativeAdapter()
    const onError = vi.fn()
    const onNext = vi.fn(async () => {
      throw new Error('private provider error')
    })
    const onPrevious = vi.fn()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      onNext,
      onPrevious,
      onError,
    })
    await playback.initialize()
    native.command({ type: 'next' })
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
    native.command({ type: 'previous' })
    await vi.waitFor(() => expect(onPrevious).toHaveBeenCalledOnce())
  })

  it('releases ownership after native play failure and natural completion', async () => {
    const native = nativeAdapter()
    const release = vi.fn(async () => undefined)
    const ownership = {
      claim: vi.fn(async () => ({ ownerId: 'phone-1', leaseId: 'lease-1' })),
      release,
    }
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      sessionId: 'party-1',
      ownership,
    })
    await playback.load(track)
    ;(native.adapter.play as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('account user@example.com failed'),
    )
    await expect(playback.play()).rejects.toThrow()
    expect(playback.snapshot).toMatchObject({ state: 'error', error: 'Error', ownerId: null })
    expect(release).toHaveBeenCalledOnce()

    await playback.play()
    native.status({ positionMs: 10_000, playing: false, ended: true })
    await vi.waitFor(() => expect(release).toHaveBeenCalledTimes(2))
    expect(playback.snapshot.ownerId).toBeNull()
  })

  it('pauses when ownership lease renewal fails', async () => {
    vi.useFakeTimers()
    const native = nativeAdapter()
    const onError = vi.fn()
    const playback = new PlaybackController({
      adapter: native.adapter,
      deviceId: 'phone-1',
      sessionId: 'party-1',
      ownershipRenewIntervalMs: 100,
      ownership: {
        claim: async () => ({ ownerId: 'phone-1', leaseId: 'lease-1' }),
        renew: async () => {
          throw new Error('lease backend secret')
        },
        release: async () => undefined,
      },
      onError,
    })
    await playback.load(track)
    await playback.play()
    await vi.advanceTimersByTimeAsync(100)

    expect(playback.snapshot).toMatchObject({ state: 'paused', ownerId: null, error: 'Error' })
    expect(native.adapter.pause).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

describe('pairing and second screen', () => {
  it('expires and revokes pairing tokens', async () => {
    const revoke = vi.fn(async () => undefined)
    const pairing = new PairingController(
      {
        create: async () => ({
          id: 'pair-1',
          code: '123456',
          qrPayload: 'pocketshot://pair/123456',
          expiresAt: '2026-01-01T00:00:00.000Z',
          status: 'pending',
        }),
        get: async () => ({
          id: 'pair-1',
          code: '123456',
          qrPayload: 'pocketshot://pair/123456',
          expiresAt: '2026-01-01T00:00:00.000Z',
          status: 'pending',
        }),
        revoke,
      },
      () => new Date('2026-01-02T00:00:00.000Z'),
    )
    await pairing.create('party-1', 'display')
    expect((await pairing.refresh()).status).toBe('expired')
    await pairing.revoke()
    expect(pairing.token?.status).toBe('revoked')
  })

  it('projects only explicitly selected public state with monotonic sequence', () => {
    const display = new SecondScreenProjector<
      { question: string; answer: string; score: number },
      { question: string; score: number }
    >('party-1', ({ question, score }) => ({ question, score }))
    const envelope = display.next({ question: 'Q?', answer: 'secret', score: 4 })

    expect(envelope).toEqual({
      schemaVersion: 1,
      sessionId: 'party-1',
      sequence: 1,
      state: { question: 'Q?', score: 4 },
    })
    expect(JSON.stringify(envelope)).not.toContain('secret')
  })
})
