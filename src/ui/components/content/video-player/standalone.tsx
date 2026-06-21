import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

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
  // expo-av is optional
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function resolveSlot(
  slots: Record<string, Record<string, unknown> | undefined> | undefined,
  tokens: DesignTokens,
  slot: string,
  implementationBase?: Record<string, unknown>,
) {
  return resolveSurfacePresentation({
    tokens,
    implementationBase,
    componentSurface: slots?.[slot],
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

export interface VideoPlayerBaseProps {
  /** Video source URL. */
  source: string
  /** Poster URL shown before playback. */
  poster?: string
  /** Begin playback automatically. */
  autoPlay?: boolean
  /** Loop playback. */
  loop?: boolean
  /** Start muted. */
  muted?: boolean
  /** Show on-screen controls (default true). */
  controls?: boolean
  /** Aspect ratio for the player frame. */
  aspectRatio?: number
  /** Style applied to the root container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone VideoPlayer — plain React props, no manifest required.
 *
 * @example
 * <VideoPlayerBase source="https://…/video.mp4" autoPlay aspectRatio={16 / 9} />
 */
export function VideoPlayerBase({
  source,
  poster,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  aspectRatio = 16 / 9,
  style,
  slots,
  testID,
  id,
}: VideoPlayerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const videoRef = useRef<VideoRef | null>(null)
  const controlsOpacity = useRef(new Animated.Value(1)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [progressWidth, setProgressWidth] = useState(1)

  const testId = testID ?? id ?? 'video-player'
  const progress = duration > 0 ? position / duration : 0

  const scheduleHideControls = useCallback(() => {
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current)
    }

    if (!isPlaying) {
      return
    }

    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setControlsVisible(false))
    }, 3000)
  }, [controlsOpacity, isPlaying])

  const showControlsOverlay = useCallback(() => {
    setControlsVisible(true)
    controlsOpacity.setValue(1)
    scheduleHideControls()
  }, [controlsOpacity, scheduleHideControls])

  useEffect(() => {
    if (isPlaying) {
      scheduleHideControls()
    }

    return () => {
      if (hideTimer.current != null) {
        clearTimeout(hideTimer.current)
      }
    }
  }, [isPlaying, scheduleHideControls])

  const handleStatusUpdate = useCallback(
    (status: VideoStatus) => {
      if (!status.isLoaded) {
        return
      }

      setIsPlaying(status.isPlaying ?? false)
      setPosition(status.positionMillis ?? 0)
      setIsMuted(status.isMuted ?? false)

      if (status.durationMillis != null && status.durationMillis > 0) {
        setDuration(status.durationMillis)
      }

      if (status.didJustFinish && !loop) {
        setIsPlaying(false)
        setPosition(0)
        setControlsVisible(true)
        controlsOpacity.setValue(1)
      }
    },
    [controlsOpacity, loop],
  )

  const handlePlayPause = useCallback(async () => {
    if (videoRef.current == null) {
      return
    }

    if (isPlaying) {
      await videoRef.current.pauseAsync()
      return
    }

    await videoRef.current.playAsync()
  }, [isPlaying])

  const handleMuteToggle = useCallback(async () => {
    if (videoRef.current == null) {
      return
    }

    await videoRef.current.setIsMutedAsync(!isMuted)
    setIsMuted((current) => !current)
  }, [isMuted])

  const handleFullscreen = useCallback(async () => {
    if (videoRef.current == null) {
      return
    }

    await videoRef.current.presentFullscreenPlayer()
  }, [])

  const handleSeek = useCallback(
    async (ratio: number) => {
      if (videoRef.current == null || duration <= 0) {
        return
      }

      const boundedRatio = Math.max(0, Math.min(1, ratio))
      await videoRef.current.setPositionAsync(Math.floor(boundedRatio * duration))
    },
    [duration],
  )

  const containerSurface = resolveSlot(slots, tokens, 'container', {
    borderRadius: 'lg',
    overflow: 'hidden',
    backgroundColor: '#000000',
  })
  const videoWrapperSurface = resolveSlot(slots, tokens, 'videoWrapper', {
    width: '100%',
    aspectRatio,
  })
  const loadingOverlaySurface = resolveSlot(slots, tokens, 'loadingOverlay', {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  })
  const videoSurface = resolveSlot(slots, tokens, 'video', {
    width: '100%',
    height: '100%',
  })
  const centerPlayButtonSurface = resolveSlot(slots, tokens, 'centerPlayButton', {
    width: 64,
    height: 64,
    borderRadius: 'full',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  })
  const centerPlayIconSurface = resolveSlot(slots, tokens, 'centerPlayIcon', {
    color: '#FFFFFF',
    fontSize: 'base',
    fontWeight: 'bold',
  })
  const bottomBarSurface = resolveSlot(slots, tokens, 'bottomBar', {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingX: 'md',
    paddingY: 'sm',
    gap: 'sm',
  })
  const timeTextSurface = resolveSlot(slots, tokens, 'timeText', {
    color: '#FFFFFF',
    fontSize: 'xs',
    minWidth: 36,
  })
  const progressContainerSurface = resolveSlot(slots, tokens, 'progressContainer', {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  })
  const progressTrackSurface = resolveSlot(slots, tokens, 'progressTrack', {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  })
  const progressFillSurface = resolveSlot(slots, tokens, 'progressFill', {
    backgroundColor: tokens.colors.primary,
  })
  const controlButtonSurface = resolveSlot(slots, tokens, 'controlButton', {
    padding: 'xs',
  })
  const controlIconSurface = resolveSlot(slots, tokens, 'controlIcon', {
    color: '#FFFFFF',
    fontSize: 'sm',
    fontWeight: 'medium',
  })
  const fallbackContainerSurface = resolveSlot(slots, tokens, 'fallbackContainer', {
    borderRadius: 'lg',
    overflow: 'hidden',
  })
  const fallbackSurface = resolveSlot(slots, tokens, 'fallback', {
    backgroundColor: tokens.colors.surfaceAlt,
    padding: 'xl',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'lg',
    border: '1 border',
  })
  const fallbackIconSurface = resolveSlot(slots, tokens, 'fallbackIcon', {
    color: 'muted',
    fontSize: 'base',
    fontWeight: 'bold',
    marginBottom: 'md',
  })
  const fallbackTitleSurface = resolveSlot(slots, tokens, 'fallbackTitle', {
    color: 'foreground',
    fontSize: 'lg',
    fontWeight: 'semibold',
    marginBottom: 'sm',
  })
  const fallbackMessageSurface = resolveSlot(slots, tokens, 'fallbackMessage', {
    color: 'muted',
    fontSize: 'sm',
    textAlign: 'center',
    marginBottom: 'sm',
  })
  const fallbackCommandSurface = resolveSlot(slots, tokens, 'fallbackCommand', {
    color: 'primary',
    fontSize: 'sm',
    fontWeight: 'medium',
    backgroundColor: tokens.colors.surface,
    paddingX: 'md',
    paddingY: 'sm',
    borderRadius: 'md',
  })

  if (ExpoVideo == null) {
    return (
      <View
        style={[fallbackContainerSurface.style as ViewStyle | undefined, style]}
        testID={testId}
      >
        <View style={fallbackSurface.style as ViewStyle | undefined}>
          <Text style={mergeTextStyle(sharedTextStyle, fallbackIconSurface)}>Video</Text>
          <Text style={mergeTextStyle(sharedTextStyle, fallbackTitleSurface)}>
            Video Player
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, fallbackMessageSurface)}>
            {'expo-av is required for video playback.\nInstall it with:'}
          </Text>
          <Text style={mergeTextStyle(sharedTextStyle, fallbackCommandSurface)}>
            npx expo install expo-av
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]} testID={testId}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={showControlsOverlay}
        style={videoWrapperSurface.style as ViewStyle | undefined}
        accessibilityRole="button"
        accessibilityLabel="Video player"
        accessibilityHint="Tap to show controls"
        testID={`${testId}-video`}
      >
        <ExpoVideo
          ref={videoRef as React.Ref<VideoRef>}
          source={{ uri: source }}
          posterSource={poster != null ? { uri: poster } : undefined}
          usePoster={poster != null}
          shouldPlay={autoPlay}
          isLooping={loop}
          isMuted={muted}
          resizeMode={ResizeMode?.CONTAIN ?? 'contain'}
          style={videoSurface.style}
          onPlaybackStatusUpdate={handleStatusUpdate}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
        />

        {loading ? (
          <View style={loadingOverlaySurface.style as ViewStyle | undefined}>
            <ActivityIndicator color="#ffffff" size="large" testID={`${testId}-loading`} />
          </View>
        ) : null}

        {controls && controlsVisible ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              },
              { opacity: controlsOpacity },
            ]}
          >
            <TouchableOpacity
              onPress={() => void handlePlayPause()}
              style={centerPlayButtonSurface.style as ViewStyle | undefined}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              testID={`${testId}-play-pause`}
              activeOpacity={0.7}
            >
              <Text style={mergeTextStyle(sharedTextStyle, centerPlayIconSurface)}>
                {isPlaying ? '||' : '>'}
              </Text>
            </TouchableOpacity>

            <View style={bottomBarSurface.style as ViewStyle | undefined}>
              <Text style={mergeTextStyle(sharedTextStyle, timeTextSurface)}>
                {formatTime(position)}
              </Text>

              <TouchableOpacity
                style={progressContainerSurface.style as ViewStyle | undefined}
                activeOpacity={1}
                onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width || 1)}
                onPress={(event) => void handleSeek(event.nativeEvent.locationX / progressWidth)}
                accessibilityRole="adjustable"
                accessibilityLabel={`Progress ${Math.round(progress * 100)} percent`}
                testID={`${testId}-progress`}
              >
                <View style={progressTrackSurface.style as ViewStyle | undefined}>
                  <View
                    style={[
                      progressFillSurface.style as ViewStyle | undefined,
                      { flex: progress },
                    ]}
                  />
                  <View style={{ flex: 1 - progress }} />
                </View>
              </TouchableOpacity>

              <Text style={mergeTextStyle(sharedTextStyle, timeTextSurface)}>
                {formatTime(duration)}
              </Text>

              <TouchableOpacity
                onPress={() => void handleMuteToggle()}
                style={controlButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
                testID={`${testId}-mute`}
                activeOpacity={0.7}
              >
                <Text style={mergeTextStyle(sharedTextStyle, controlIconSurface)}>
                  {isMuted ? 'Mute' : 'Sound'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleFullscreen()}
                style={controlButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel="Fullscreen"
                testID={`${testId}-fullscreen`}
                activeOpacity={0.7}
              >
                <Text style={mergeTextStyle(sharedTextStyle, controlIconSurface)}>Full</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : null}
      </TouchableOpacity>
    </View>
  )
}
