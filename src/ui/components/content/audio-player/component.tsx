import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { AudioPlayerConfig } from './types'

// ── Optional peer dep: expo-av ────────────────────────────────────────────────

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
  // expo-av not installed
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Generate deterministic pseudo-random waveform bar heights from a seed string. */
function generateWaveformBars(seed: string, count: number): number[] {
  const bars: number[] = []
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  for (let i = 0; i < count; i++) {
    hash = ((hash << 5) - hash + i * 7 + 13) | 0
    const normalized = (Math.abs(hash) % 80 + 20) / 100 // 0.2 - 1.0
    bars.push(normalized)
  }
  return bars
}

const WAVEFORM_BAR_COUNT = 40
const WAVEFORM_BAR_WIDTH = 3
const WAVEFORM_BAR_GAP = 2
const WAVEFORM_MAX_HEIGHT = 32

// ── Component ─────────────────────────────────────────────────────────────────

export function AudioPlayer({ config }: { config: AudioPlayerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const source = resolveFromRef(config.source, values) as string
  const showWaveform = config.showWaveform ?? true
  const autoPlay = config.autoPlay ?? false

  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const soundRef = useRef<SoundInstance | null>(null)
  const playPulse = useRef(new Animated.Value(1)).current

  const waveformBars = useMemo(() => generateWaveformBars(source, WAVEFORM_BAR_COUNT), [source])

  // Load audio
  useEffect(() => {
    if (ExpoAudio == null) return

    let mounted = true
    let sound: SoundInstance | null = null

    const load = async () => {
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
        if (!status.isLoaded) return
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
    }

    void load()

    return () => {
      mounted = false
      if (sound != null) {
        void sound.unloadAsync()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  // Play button pulse animation
  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(playPulse, {
            toValue: 0.85,
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
    }
    playPulse.setValue(1)
    return undefined
  }, [isPlaying, playPulse])

  const handlePlayPause = useCallback(async () => {
    if (soundRef.current == null) return
    if (isPlaying) {
      await soundRef.current.pauseAsync()
    } else {
      await soundRef.current.playAsync()
    }
  }, [isPlaying])

  const handleSeek = useCallback(
    async (barIndex: number) => {
      if (soundRef.current == null || duration === 0) return
      const ratio = barIndex / WAVEFORM_BAR_COUNT
      await soundRef.current.setPositionAsync(Math.floor(ratio * duration))
    },
    [duration],
  )

  const progress = duration > 0 ? position / duration : 0
  const progressBarIndex = Math.floor(progress * WAVEFORM_BAR_COUNT)
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const testId = config.testID ?? config.id

  // Fallback when expo-av is not installed
  if (ExpoAudio == null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View testID={testId} style={styles.fallback}>
          <Text style={styles.fallbackIcon} accessibilityElementsHidden>
            {'\u{1F3B5}'}
          </Text>
          <View style={styles.fallbackTextContainer}>
            <Text style={styles.fallbackTitle}>Audio Player</Text>
            <Text style={styles.fallbackMessage}>
              expo-av is required for audio playback.
            </Text>
            <Text style={styles.fallbackCommand}>npx expo install expo-av</Text>
          </View>
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId} style={styles.container}>
        {/* Play/pause button */}
        <Animated.View style={{ transform: [{ scale: playPulse }] }}>
          <TouchableOpacity
            onPress={() => void handlePlayPause()}
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            testID={`${testId}-play-pause`}
            activeOpacity={0.7}
            disabled={!isLoaded}
          >
            <Text style={styles.playIcon}>
              {isPlaying ? '\u23F8' : '\u25B6'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Center section: waveform/progress + metadata */}
        <View style={styles.centerSection}>
          {/* Title / Artist */}
          {(config.title != null || config.artist != null) && (
            <View style={styles.metaRow}>
              {config.title != null && (
                <Text style={styles.title} numberOfLines={1}>
                  {config.title}
                </Text>
              )}
              {config.artist != null && (
                <Text style={styles.artist} numberOfLines={1}>
                  {config.artist}
                </Text>
              )}
            </View>
          )}

          {/* Waveform or progress bar */}
          {showWaveform ? (
            <View style={styles.waveformContainer}>
              {waveformBars.map((height, idx) => {
                const isPast = idx < progressBarIndex
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => void handleSeek(idx)}
                    style={[
                      styles.waveformBar,
                      {
                        height: height * WAVEFORM_MAX_HEIGHT,
                        backgroundColor: isPast
                          ? tokens.colors.primary
                          : tokens.colors.muted,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Seek to ${Math.round((idx / WAVEFORM_BAR_COUNT) * 100)}%`}
                    testID={`${testId}-waveform-bar-${idx}`}
                  />
                )
              })}
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { flex: progress }]} />
                <View style={{ flex: 1 - progress }} />
              </View>
            </View>
          )}

          {/* Time */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>
              {duration > 0 ? `-${formatTime(duration - position)}` : '--:--'}
            </Text>
          </View>
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[3],
      gap: tokens.spacing[3],
    },
    playButton: {
      width: 48,
      height: 48,
      borderRadius: tokens.radius.full,
      backgroundColor: tokens.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButtonActive: {
      backgroundColor: tokens.colors.primary,
    },
    playIcon: {
      color: tokens.colors.primaryForeground,
      fontSize: 20,
    },
    centerSection: {
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
      marginBottom: tokens.spacing[1],
    },
    title: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      flexShrink: 1,
    },
    artist: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      flexShrink: 1,
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: WAVEFORM_MAX_HEIGHT,
      gap: WAVEFORM_BAR_GAP,
    },
    waveformBar: {
      width: WAVEFORM_BAR_WIDTH,
      borderRadius: WAVEFORM_BAR_WIDTH / 2,
      minHeight: 4,
    },
    progressContainer: {
      height: 24,
      justifyContent: 'center',
    },
    progressTrack: {
      height: 3,
      backgroundColor: tokens.colors.muted,
      borderRadius: 2,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: tokens.colors.primary,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: tokens.spacing[1],
    },
    timeText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    fallback: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      gap: tokens.spacing[3],
    },
    fallbackIcon: {
      fontSize: 32,
      color: tokens.colors.textMuted,
    },
    fallbackTextContainer: {
      flex: 1,
    },
    fallbackTitle: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    fallbackMessage: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[1],
    },
    fallbackCommand: {
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primary,
    },
  })
}

