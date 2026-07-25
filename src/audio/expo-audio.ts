import type { AudioTrack, NativePlaybackAdapter, RemotePlaybackCommand } from './types'

interface ExpoAudioStatus {
  currentTime: number
  duration: number
  playing: boolean
  didJustFinish?: boolean
  isBuffering?: boolean
  error?: string
}

interface ExpoAudioPlayer {
  replace(source: string): void
  play(): void
  pause(): void
  seekTo(seconds: number): Promise<void>
  remove(): void
  addListener(
    event: 'playbackStatusUpdate',
    listener: (status: ExpoAudioStatus) => void,
  ): { remove(): void }
  setActiveForLockScreen(
    active: boolean,
    metadata?: { title: string; artist?: string; artworkUrl?: string },
  ): void
}

export interface ExpoAudioModuleLike {
  setAudioModeAsync(options: {
    playsInSilentMode: boolean
    shouldPlayInBackground: boolean
    interruptionMode: 'mixWithOthers' | 'duckOthers' | 'doNotMix'
  }): Promise<void>
  createAudioPlayer(source: string | null, options?: { updateInterval?: number }): ExpoAudioPlayer
}

/**
 * Native Expo Audio adapter. Apps inject `expo-audio` so PocketShot remains
 * compatible with the Expo SDK version selected by the consumer.
 */
export function createExpoAudioPlaybackAdapter(audio: ExpoAudioModuleLike): NativePlaybackAdapter {
  let player: ExpoAudioPlayer | null = null
  let track: AudioTrack | null = null
  let listener:
    | ((status: {
        positionMs: number
        durationMs?: number
        bufferedMs?: number
        playing: boolean
        ended?: boolean
        error?: string
      }) => void)
    | null = null
  let subscription: { remove(): void } | null = null
  let background = false

  const ensurePlayer = () => {
    player ??= audio.createAudioPlayer(null, { updateInterval: 250 })
    return player
  }
  const bind = () => {
    subscription?.remove()
    subscription = ensurePlayer().addListener('playbackStatusUpdate', (status) => {
      listener?.({
        positionMs: status.currentTime * 1_000,
        durationMs: status.duration * 1_000,
        playing: status.playing,
        ended: status.didJustFinish,
        ...(status.error ? { error: status.error } : {}),
      })
    })
  }
  return {
    async configure(options) {
      background = options.staysActiveInBackground
      await audio.setAudioModeAsync({
        playsInSilentMode: options.playsInSilentMode,
        shouldPlayInBackground: options.staysActiveInBackground,
        interruptionMode:
          options.interruptionMode === 'mix'
            ? 'mixWithOthers'
            : options.interruptionMode === 'duck'
              ? 'duckOthers'
              : 'doNotMix',
      })
      ensurePlayer()
      bind()
    },
    async load(nextTrack) {
      const source = nextTrack.playbackUrl ?? nextTrack.previewUrl
      if (!source) throw new Error('[pocketshot] Track has no playback or preview URL')
      track = nextTrack
      ensurePlayer().replace(source)
    },
    async play() {
      const current = ensurePlayer()
      if (background && track) {
        current.setActiveForLockScreen(true, {
          title: track.title,
          ...(track.artist ? { artist: track.artist } : {}),
          ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
        })
      }
      current.play()
    },
    async pause() {
      ensurePlayer().pause()
    },
    async stop() {
      const current = ensurePlayer()
      current.pause()
      await current.seekTo(0)
      current.setActiveForLockScreen(false)
    },
    async seek(positionMs) {
      await ensurePlayer().seekTo(positionMs / 1_000)
    },
    async unload() {
      subscription?.remove()
      subscription = null
      player?.setActiveForLockScreen(false)
      player?.remove()
      player = null
      track = null
    },
    subscribe(next) {
      listener = next
      if (player) bind()
      return () => {
        listener = null
      }
    },
    setRemoteCommandHandler(_handler: (command: RemotePlaybackCommand) => void) {
      // expo-audio applies lock-screen commands to the active player itself;
      // playbackStatusUpdate feeds the resulting state back to the controller.
      return () => undefined
    },
  }
}
