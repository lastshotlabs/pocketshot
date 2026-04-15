import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { VideoPlayerConfig } from './types'

// ── Optional peer dep: expo-av ────────────────────────────────────────────────

interface VideoStatus {
  isLoaded: boolean
  isPlaying?: boolean
  positionMillis?: number
  durationMillis?: number
  didJustFinish?: boolean
  isMuted?: boolean
}

interface VideoRef {
  playAsync: () => Promise<void>
  pauseAsync: () => Promise<void>
  setPositionAsync: (millis: number) => Promise<void>
  setIsMutedAsync: (muted: boolean) => Promise<void>
  presentFullscreenPlayer: () => Promise<void>
}

let ExpoVideo: React.ComponentType<{
  ref?: React.Ref<VideoRef>
  source: { uri: string }
  posterSource?: { uri: string }
  usePoster?: boolean
  shouldPlay?: boolean
  isLooping?: boolean
  isMuted?: boolean
  resizeMode?: string
  style?: object
  onPlaybackStatusUpdate?: (status: VideoStatus) => void
  onLoadStart?: () => void
  onLoad?: () => void
}> | null = null

let ResizeMode: { CONTAIN: string } | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-av') as {
    Video: typeof ExpoVideo
    ResizeMode: typeof ResizeMode
  }
  ExpoVideo = mod.Video
  ResizeMode = mod.ResizeMode
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

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoPlayer({ config }: { config: VideoPlayerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const source = resolveFromRef(config.source, values) as string
  const autoPlay = config.autoPlay ?? false
  const loop = config.loop ?? false
  const initialMuted = config.muted ?? false
  const showControls = config.controls ?? true
  const aspectRatio = config.aspectRatio ?? 16 / 9

  const videoRef = useRef<VideoRef>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHideControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (isPlaying) {
      hideTimer.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setControlsVisible(false))
      }, 3000)
    }
  }, [isPlaying, controlsOpacity])

  const showControlsOverlay = useCallback(() => {
    setControlsVisible(true)
    controlsOpacity.setValue(1)
    scheduleHideControls()
  }, [controlsOpacity, scheduleHideControls])

  useEffect(() => {
    if (isPlaying) scheduleHideControls()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [isPlaying, scheduleHideControls])

  const handlePlayPause = useCallback(async () => {
    if (videoRef.current == null) return
    if (isPlaying) {
      await videoRef.current.pauseAsync()
    } else {
      await videoRef.current.playAsync()
    }
  }, [isPlaying])

  const handleMuteToggle = useCallback(async () => {
    if (videoRef.current == null) return
    await videoRef.current.setIsMutedAsync(!isMuted)
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleFullscreen = useCallback(async () => {
    if (videoRef.current == null) return
    await videoRef.current.presentFullscreenPlayer()
  }, [])

  const handleSeek = useCallback(
    async (ratio: number) => {
      if (videoRef.current == null || duration === 0) return
      const newPos = Math.floor(ratio * duration)
      await videoRef.current.setPositionAsync(newPos)
    },
    [duration],
  )

  const handleStatusUpdate = useCallback((status: VideoStatus) => {
    if (!status.isLoaded) return
    setIsPlaying(status.isPlaying ?? false)
    setPosition(status.positionMillis ?? 0)
    if (status.durationMillis != null && status.durationMillis > 0) {
      setDuration(status.durationMillis)
    }
  }, [])

  const progress = duration > 0 ? position / duration : 0
  const styles = useMemo(() => makeStyles(tokens, aspectRatio), [tokens, aspectRatio])
  const testId = config.testID ?? config.id

  // Fallback when expo-av is not installed
  if (ExpoVideo == null) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID} config={config}>
        <View testID={testId} style={styles.fallbackContainer}>
          <View style={styles.fallback}>
            <Text style={styles.fallbackIcon} accessibilityElementsHidden>
              {'\u25B6'}
            </Text>
            <Text style={styles.fallbackTitle}>Video Player</Text>
            <Text style={styles.fallbackMessage}>
              expo-av is required for video playback.{'\n'}Install it with:
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
        <TouchableOpacity
          activeOpacity={1}
          onPress={showControlsOverlay}
          style={styles.videoWrapper}
          accessibilityRole="button"
          accessibilityLabel="Video player"
          accessibilityHint="Tap to show controls"
          testID={`${testId}-video`}
        >
          <ExpoVideo
            ref={videoRef as React.Ref<VideoRef>}
            source={{ uri: source }}
            posterSource={config.poster ? { uri: config.poster } : undefined}
            usePoster={config.poster != null}
            shouldPlay={autoPlay}
            isLooping={loop}
            isMuted={initialMuted}
            resizeMode={ResizeMode?.CONTAIN ?? 'contain'}
            style={styles.video}
            onPlaybackStatusUpdate={handleStatusUpdate}
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
          />

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#ffffff" size="large" testID={`${testId}-loading`} />
            </View>
          )}

          {/* Controls overlay */}
          {showControls && controlsVisible && (
            <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
              {/* Center play/pause */}
              <TouchableOpacity
                onPress={() => void handlePlayPause()}
                style={styles.centerPlayButton}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                testID={`${testId}-play-pause`}
                activeOpacity={0.7}
              >
                <Text style={styles.centerPlayIcon}>
                  {isPlaying ? '\u23F8' : '\u25B6'}
                </Text>
              </TouchableOpacity>

              {/* Bottom bar */}
              <View style={styles.bottomBar}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>

                {/* Progress bar */}
                <TouchableOpacity
                  style={styles.progressContainer}
                  activeOpacity={1}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent
                    const width = styles.progressContainer.flex ?? 1
                    // Approximate: use the locationX vs container width
                    void handleSeek(locationX / (typeof width === 'number' ? width : 200))
                  }}
                  accessibilityRole="adjustable"
                  accessibilityLabel={`Progress: ${Math.round(progress * 100)}%`}
                  testID={`${testId}-progress`}
                >
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { flex: progress }]} />
                    <View style={{ flex: 1 - progress }} />
                  </View>
                </TouchableOpacity>

                <Text style={styles.timeText}>{formatTime(duration)}</Text>

                {/* Mute toggle */}
                <TouchableOpacity
                  onPress={() => void handleMuteToggle()}
                  style={styles.controlButton}
                  accessibilityRole="button"
                  accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
                  testID={`${testId}-mute`}
                >
                  <Text style={styles.controlIcon}>
                    {isMuted ? '\u{1F507}' : '\u{1F50A}'}
                  </Text>
                </TouchableOpacity>

                {/* Fullscreen */}
                <TouchableOpacity
                  onPress={() => void handleFullscreen()}
                  style={styles.controlButton}
                  accessibilityRole="button"
                  accessibilityLabel="Fullscreen"
                  testID={`${testId}-fullscreen`}
                >
                  <Text style={styles.controlIcon}>{'\u26F6'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, aspectRatio: number) {
  return StyleSheet.create({
    container: {
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
      backgroundColor: '#000000',
    },
    videoWrapper: {
      aspectRatio,
      width: '100%',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    controlsOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerPlayButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerPlayIcon: {
      color: '#ffffff',
      fontSize: 28,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      gap: tokens.spacing[2],
    },
    timeText: {
      color: '#ffffff',
      fontSize: tokens.typography.fontSizeXs,
      fontVariant: ['tabular-nums'],
      minWidth: 36,
    },
    progressContainer: {
      flex: 1,
      height: 24,
      justifyContent: 'center',
    },
    progressTrack: {
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressFill: {
      backgroundColor: tokens.colors.primary,
    },
    controlButton: {
      padding: tokens.spacing[1],
    },
    controlIcon: {
      color: '#ffffff',
      fontSize: tokens.typography.fontSizeMd,
    },
    fallbackContainer: {
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
    },
    fallback: {
      backgroundColor: tokens.colors.surfaceAlt,
      padding: tokens.spacing[8],
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.lg,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    fallbackIcon: {
      fontSize: 36,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[3],
    },
    fallbackTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[2],
    },
    fallbackMessage: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      marginBottom: tokens.spacing[2],
    },
    fallbackCommand: {
      fontFamily: 'monospace',
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.primary,
      backgroundColor: tokens.colors.surface,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      borderRadius: tokens.radius.md,
      overflow: 'hidden',
    },
  })
}

