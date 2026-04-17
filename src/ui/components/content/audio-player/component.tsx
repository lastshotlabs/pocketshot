import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { AudioPlayerConfig } from './types'

interface AudioStatus {
  isLoaded: boolean
  isPlaying?: boolean
  positionMillis?: number
  durationMillis?: number
  didJustFinish?: boolean
}

interface SoundInstance {
  playAsync: () => Promise<void>
  pauseAsync: () => Promise<void>
  setPositionAsync: (millis: number) => Promise<void>
  unloadAsync: () => Promise<void>
  setOnPlaybackStatusUpdate: (callback: (status: AudioStatus) => void) => void
}

interface AudioModule {
  Sound: {
    createAsync: (
      source: { uri: string },
      initialStatus?: { shouldPlay?: boolean },
    ) => Promise<{ sound: SoundInstance; status: AudioStatus }>
  }
}

let ExpoAudio: AudioModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-av') as { Audio: AudioModule }
  ExpoAudio = mod.Audio
} catch {
  // expo-av is optional
}

const WAVEFORM_BAR_COUNT = 40
const WAVEFORM_MAX_HEIGHT = 32

function formatTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function generateWaveformBars(seed: string, count: number): number[] {
  const bars: number[] = []
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  }

  for (let index = 0; index < count; index += 1) {
    hash = ((hash << 5) - hash + index * 7 + 13) | 0
    bars.push((Math.abs(hash) % 80 + 20) / 100)
  }

  return bars
}

function resolveSlotSurface(
  config: AudioPlayerConfig,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface:
      (config.slots as Record<string, Record<string, unknown> | undefined> | undefined)?.[slot],
  })
}

function mergeTextStyle(
  sharedTextStyle: TextStyle,
  surface: ReturnType<typeof resolveSurfacePresentation>,
): TextStyle {
  return {
    ...sharedTextStyle,
    ...(surface.style as TextStyle | undefined),
  }
}

export function AudioPlayer({ config }: { config: AudioPlayerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const source = String(resolveFromRef(config.source, values) ?? '')
  const title =
    config.title != null ? String(resolveFromRef(config.title, values) ?? '') : undefined
  const artist =
    config.artist != null ? String(resolveFromRef(config.artist, values) ?? '') : undefined
  const showWaveform = config.showWaveform ?? true
  const autoPlay = config.autoPlay ?? false

  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const soundRef = useRef<SoundInstance | null>(null)
  const playPulse = useRef(new Animated.Value(1)).current

  const waveformBars = useMemo(
    () => generateWaveformBars(source, WAVEFORM_BAR_COUNT),
    [source],
  )

  useEffect(() => {
    if (ExpoAudio == null || source.length === 0) {
      return undefined
    }

    let mounted = true
    let sound: SoundInstance | null = null

    const load = async () => {
      try {
        const result = await ExpoAudio!.Sound.createAsync(
          { uri: source },
          { shouldPlay: autoPlay },
        )

        if (!mounted) {
          await result.sound.unloadAsync()
          return
        }

        sound = result.sound
        soundRef.current = sound

        if (result.status.isLoaded) {
          setIsLoaded(true)
          setDuration(result.status.durationMillis ?? 0)
          setIsPlaying(result.status.isPlaying ?? false)
        }

        sound.setOnPlaybackStatusUpdate((status: AudioStatus) => {
          if (!status.isLoaded) {
            return
          }

          setIsPlaying(status.isPlaying ?? false)
          setPosition(status.positionMillis ?? 0)

          if (status.durationMillis != null && status.durationMillis > 0) {
            setDuration(status.durationMillis)
          }

          if (status.didJustFinish) {
            setIsPlaying(false)
            setPosition(0)
          }
        })
      } catch {
        setIsLoaded(false)
      }
    }

    void load()

    return () => {
      mounted = false
      soundRef.current = null
      if (sound != null) {
        void sound.unloadAsync()
      }
    }
  }, [autoPlay, source])

  useEffect(() => {
    if (!isPlaying) {
      playPulse.setValue(1)
      return undefined
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(playPulse, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(playPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    )

    loop.start()
    return () => loop.stop()
  }, [isPlaying, playPulse])

  const handlePlayPause = useCallback(async () => {
    if (soundRef.current == null) {
      return
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync()
      return
    }

    await soundRef.current.playAsync()
  }, [isPlaying])

  const handleSeek = useCallback(
    async (barIndex: number) => {
      if (soundRef.current == null || duration <= 0) {
        return
      }

      const ratio = barIndex / WAVEFORM_BAR_COUNT
      await soundRef.current.setPositionAsync(Math.floor(ratio * duration))
    },
    [duration],
  )

  const progress = duration > 0 ? position / duration : 0
  const progressBarIndex = Math.floor(progress * WAVEFORM_BAR_COUNT)
  const testId = config.testID ?? config.id ?? 'audio-player'

  const containerSurface = resolveSlotSurface(config, tokens, 'container', {
    flexDirection: 'row',
    alignItems: 'center',
    bg: 'card',
    border: '1 border',
    borderRadius: 'lg',
    padding: 'md',
    gap: 'md',
  })
  const playButtonSurface = resolveSlotSurface(config, tokens, 'playButton', {
    width: 48,
    height: 48,
    borderRadius: 'full',
    bg: 'primary',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 1 : 0.5,
  })
  const playIconSurface = resolveSlotSurface(config, tokens, 'playIcon', {
    color: 'primary-foreground',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const centerSectionSurface = resolveSlotSurface(config, tokens, 'centerSection', {
    flex: 1,
  })
  const metaRowSurface = resolveSlotSurface(config, tokens, 'metaRow', {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'sm',
    marginBottom: 'xs',
  })
  const titleSurface = resolveSlotSurface(config, tokens, 'title', {
    color: 'foreground',
    fontSize: 'sm',
    fontWeight: 'semibold',
    flex: 1,
  })
  const artistSurface = resolveSlotSurface(config, tokens, 'artist', {
    color: 'muted',
    fontSize: 'xs',
    flex: 1,
  })
  const waveformSurface = resolveSlotSurface(config, tokens, 'waveform', {
    flexDirection: 'row',
    alignItems: 'center',
    height: WAVEFORM_MAX_HEIGHT,
    gap: 2,
  })
  const progressContainerSurface = resolveSlotSurface(config, tokens, 'progressContainer', {
    height: 24,
    justifyContent: 'center',
  })
  const progressTrackSurface = resolveSlotSurface(config, tokens, 'progressTrack', {
    height: 3,
    bg: 'muted',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  })
  const progressFillSurface = resolveSlotSurface(config, tokens, 'progressFill', {
    bg: 'primary',
  })
  const timeRowSurface = resolveSlotSurface(config, tokens, 'timeRow', {
    flexDirection: 'row',
    justifyContent: 'between',
    marginTop: 'xs',
  })
  const timeTextSurface = resolveSlotSurface(config, tokens, 'timeText', {
    color: 'muted',
    fontSize: 'xs',
  })
  const fallbackSurface = resolveSlotSurface(config, tokens, 'fallback', {
    flexDirection: 'row',
    alignItems: 'center',
    bg: 'popover',
    border: '1 border',
    borderRadius: 'lg',
    padding: 'lg',
    gap: 'md',
  })
  const fallbackIconSurface = resolveSlotSurface(config, tokens, 'fallbackIcon', {
    color: 'muted',
    fontSize: 'sm',
    fontWeight: 'bold',
  })
  const fallbackTitleSurface = resolveSlotSurface(config, tokens, 'fallbackTitle', {
    color: 'foreground',
    fontSize: 'base',
    fontWeight: 'semibold',
    marginBottom: 'xs',
  })
  const fallbackMessageSurface = resolveSlotSurface(config, tokens, 'fallbackMessage', {
    color: 'muted',
    fontSize: 'sm',
    marginBottom: 'xs',
  })
  const fallbackCommandSurface = resolveSlotSurface(config, tokens, 'fallbackCommand', {
    color: 'primary',
    fontSize: 'xs',
    fontWeight: 'medium',
  })

  if (ExpoAudio == null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View testID={testId} style={fallbackSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, fallbackIconSurface)}>Audio</Text>
          <View style={{ flex: 1 }}>
            <Text style={mergeTextStyle(sharedTextStyle, fallbackTitleSurface)}>
              Audio Player
            </Text>
            <Text style={mergeTextStyle(sharedTextStyle, fallbackMessageSurface)}>
              expo-av is required for audio playback.
            </Text>
            <Text style={mergeTextStyle(sharedTextStyle, fallbackCommandSurface)}>
              npx expo install expo-av
            </Text>
          </View>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId} style={containerSurface.style as ViewStyle | undefined}>
        <Animated.View style={{ transform: [{ scale: playPulse }] }}>
          <TouchableOpacity
            onPress={() => void handlePlayPause()}
            style={playButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            testID={`${testId}-play-pause`}
            activeOpacity={0.7}
            disabled={!isLoaded}
          >
            <Text style={mergeTextStyle(sharedTextStyle, playIconSurface)}>
              {isPlaying ? '||' : '>'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={centerSectionSurface.style as ViewStyle | undefined}>
          {(title != null || artist != null) && (
            <View style={metaRowSurface.style as ViewStyle | undefined}>
              {title != null ? (
                <Text
                  style={mergeTextStyle(sharedTextStyle, titleSurface)}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              ) : null}
              {artist != null ? (
                <Text
                  style={mergeTextStyle(sharedTextStyle, artistSurface)}
                  numberOfLines={1}
                >
                  {artist}
                </Text>
              ) : null}
            </View>
          )}

          {showWaveform ? (
            <View style={waveformSurface.style as ViewStyle | undefined}>
              {waveformBars.map((height, index) => {
                const waveformBarSurface = resolveSlotSurface(config, tokens, 'waveformBar', {
                  width: 3,
                  minHeight: 4,
                  height: Math.round(height * WAVEFORM_MAX_HEIGHT),
                  borderRadius: 2,
                  backgroundColor:
                    index < progressBarIndex
                      ? tokens.colors.primary
                      : tokens.colors.muted,
                })

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => void handleSeek(index)}
                    style={waveformBarSurface.style as ViewStyle | undefined}
                    accessibilityRole="button"
                    accessibilityLabel={`Seek to ${Math.round((index / WAVEFORM_BAR_COUNT) * 100)} percent`}
                    testID={`${testId}-waveform-bar-${index}`}
                    activeOpacity={0.7}
                  />
                )
              })}
            </View>
          ) : (
            <View style={progressContainerSurface.style as ViewStyle | undefined}>
              <View style={progressTrackSurface.style as ViewStyle | undefined}>
                <View
                  style={[
                    progressFillSurface.style as ViewStyle | undefined,
                    { flex: progress },
                  ]}
                />
                <View style={{ flex: 1 - progress }} />
              </View>
            </View>
          )}

          <View style={timeRowSurface.style as ViewStyle | undefined}>
            <Text style={mergeTextStyle(sharedTextStyle, timeTextSurface)}>
              {formatTime(position)}
            </Text>
            <Text style={mergeTextStyle(sharedTextStyle, timeTextSurface)}>
              {duration > 0 ? `-${formatTime(duration - position)}` : '--:--'}
            </Text>
          </View>
        </View>
      </View>
    </ComponentWrapper>
  )
}
