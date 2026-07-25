import { describe, expect, it, vi } from 'vitest'
import { createExpoAudioPlaybackAdapter } from '../../src/audio'

describe('createExpoAudioPlaybackAdapter', () => {
  it('configures background audio, lock screen metadata, status, and millisecond seeking', async () => {
    type Status = {
      currentTime: number
      duration: number
      playing: boolean
      didJustFinish?: boolean
    }
    let emitStatus = (_value: Status): void => undefined
    const player = {
      replace: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      seekTo: vi.fn(async () => undefined),
      remove: vi.fn(),
      addListener: vi.fn((_event, listener) => {
        emitStatus = listener
        return { remove: vi.fn() }
      }),
      setActiveForLockScreen: vi.fn(),
    }
    const audio = {
      setAudioModeAsync: vi.fn(async () => undefined),
      createAudioPlayer: vi.fn(() => player),
    }
    const adapter = createExpoAudioPlaybackAdapter(audio)
    const updates = vi.fn()
    await adapter.configure({
      playsInSilentMode: true,
      staysActiveInBackground: true,
      interruptionMode: 'pause',
    })
    adapter.subscribe(updates)
    await adapter.load({
      id: '1',
      provider: 'test',
      title: 'Track',
      artist: 'Artist',
      playbackUrl: 'https://cdn.test/track.mp3',
      playable: true,
    })
    await adapter.play()
    await adapter.seek(2_500)
    emitStatus({ currentTime: 2.5, duration: 10, playing: true })

    expect(audio.setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
    expect(player.replace).toHaveBeenCalledWith('https://cdn.test/track.mp3')
    expect(player.setActiveForLockScreen).toHaveBeenCalledWith(true, {
      title: 'Track',
      artist: 'Artist',
    })
    expect(player.seekTo).toHaveBeenCalledWith(2.5)
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ positionMs: 2_500, durationMs: 10_000, playing: true }),
    )
  })
})
