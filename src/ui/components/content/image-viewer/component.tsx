import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, resolveNativeTextStyle, resolveSurfacePresentation, toNativeDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { ImageViewerConfig } from './types'

const SCREEN = Dimensions.get('window')
const DOUBLE_TAP_DELAY = 300

export function ImageViewer({ config }: { config: ImageViewerConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const source = resolveFromRef(config.source, values) as string
  const enableZoom = config.enableZoom ?? true
  const maxZoom = config.maxZoom ?? 3
  const showCloseButton = config.showCloseButton ?? true
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const thumbnailFrame = useMemo(() => resolveThumbnailFrame(tokens, config), [config, tokens])
  const imageWidth = thumbnailFrame.width ?? SCREEN.width
  const imageHeight = thumbnailFrame.height ?? SCREEN.width * 0.75

  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(true)

  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const baseScale = useRef(1)
  const lastTap = useRef(0)
  const pinchDistance = useRef(0)

  const resetTransform = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start()
    baseScale.current = 1
  }, [scale, translateX, translateY])

  const handleDoubleTap = useCallback(() => {
    if (baseScale.current > 1) {
      resetTransform()
    } else {
      const zoomLevel = Math.min(2, maxZoom)
      Animated.spring(scale, { toValue: zoomLevel, useNativeDriver: true }).start()
      baseScale.current = zoomLevel
    }
  }, [maxZoom, resetTransform, scale])

  const panResponder = useMemo(() => {
    if (!enableZoom) return null

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (event) => {
        const now = Date.now()
        if (event.nativeEvent.touches.length === 1 && now - lastTap.current < DOUBLE_TAP_DELAY) {
          handleDoubleTap()
        }
        lastTap.current = now

        if (event.nativeEvent.touches.length === 2) {
          const touches = event.nativeEvent.touches
          const dx = touches[0].pageX - touches[1].pageX
          const dy = touches[0].pageY - touches[1].pageY
          pinchDistance.current = Math.sqrt(dx * dx + dy * dy)
        }
      },
      onPanResponderMove: (event, gestureState) => {
        if (event.nativeEvent.touches.length === 2) {
          const touches = event.nativeEvent.touches
          const dx = touches[0].pageX - touches[1].pageX
          const dy = touches[0].pageY - touches[1].pageY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (pinchDistance.current > 0) {
            const newScale = Math.max(
              0.5,
              Math.min(maxZoom, baseScale.current * (distance / pinchDistance.current)),
            )
            scale.setValue(newScale)
          }
        } else if (baseScale.current > 1) {
          translateX.setValue(gestureState.dx)
          translateY.setValue(gestureState.dy)
        } else if (gestureState.dy > 60) {
          setModalVisible(false)
          resetTransform()
        }
      },
      onPanResponderRelease: (event) => {
        if (event.nativeEvent.touches.length < 2 && pinchDistance.current > 0) {
          const currentScale = (scale as unknown as { _value: number })._value
          baseScale.current = Math.max(0.5, Math.min(maxZoom, currentScale))
          if (baseScale.current < 1) {
            resetTransform()
          }
          pinchDistance.current = 0
        }
      },
    })
  }, [enableZoom, handleDoubleTap, maxZoom, resetTransform, scale, translateX, translateY])

  const handleOpenModal = useCallback(() => {
    setModalVisible(true)
    setModalLoading(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    resetTransform()
  }, [resetTransform])

  const thumbnailContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      borderRadius: thumbnailFrame.borderRadius ?? 'md',
      overflow: 'hidden',
      bg: 'muted',
    },
    componentSurface: config.slots?.thumbnailContainer as Record<string, unknown> | undefined,
  })
  const thumbnailImageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: imageWidth,
      height: imageHeight,
      ...(thumbnailFrame.borderRadius != null ? { borderRadius: thumbnailFrame.borderRadius } : undefined),
    },
    componentSurface: config.slots?.thumbnailImage as Record<string, unknown> | undefined,
  })
  const modalBackdropSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      bg: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.95,
    },
    componentSurface: config.slots?.modalBackdrop as Record<string, unknown> | undefined,
  })
  const closeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      top: 56,
      right: 'lg',
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 'full',
      bg: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.closeButton as Record<string, unknown> | undefined,
  })
  const closeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: '#ffffff',
      fontSize: 'lg',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.closeButtonText as Record<string, unknown> | undefined,
  })
  const modalContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      width: SCREEN.width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    componentSurface: config.slots?.modalContent as Record<string, unknown> | undefined,
  })
  const fullImageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: SCREEN.width,
      height: SCREEN.height * 0.75,
    },
    componentSurface: config.slots?.fullImage as Record<string, unknown> | undefined,
  })
  const captionBarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      bottom: 48,
      left: 0,
      right: 0,
      paddingX: 'lg',
      paddingY: 'sm',
      alignItems: 'center',
    },
    componentSurface: config.slots?.captionBar as Record<string, unknown> | undefined,
  })
  const captionTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: '#ffffff',
      fontSize: 'sm',
      textAlign: 'center',
    },
    componentSurface: config.slots?.captionText as Record<string, unknown> | undefined,
  })

  const testId = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        <TouchableOpacity
          onPress={handleOpenModal}
          activeOpacity={0.9}
          accessibilityRole="image"
          accessibilityLabel={config.alt ?? 'Image'}
          accessibilityHint="Tap to view full screen"
          testID={`${testId}-thumbnail`}
        >
          <View
            style={{
              ...(thumbnailContainerSurface.style as ViewStyle | undefined),
              width: imageWidth,
              height: imageHeight,
            }}
          >
            {loading ? (
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                color={tokens.colors.primary}
                testID={`${testId}-loading`}
              />
            ) : null}
            <Image
              source={{ uri: source }}
              style={thumbnailImageSurface.style as ImageStyle | undefined}
              resizeMode="cover"
              onLoadEnd={() => setLoading(false)}
              accessibilityLabel={config.alt ?? 'Image'}
            />
          </View>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <View style={modalBackdropSurface.style as ViewStyle | undefined}>
            {showCloseButton ? (
              <TouchableOpacity
                onPress={handleCloseModal}
                style={closeButtonSurface.style as ViewStyle | undefined}
                accessibilityRole="button"
                accessibilityLabel="Close image viewer"
                testID={`${testId}-close`}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(closeButtonTextSurface.style as TextStyle | undefined),
                  }}
                >
                  X
                </Text>
              </TouchableOpacity>
            ) : null}

            <View
              style={modalContentSurface.style as ViewStyle | undefined}
              {...(panResponder?.panHandlers ?? {})}
            >
              {modalLoading ? (
                <ActivityIndicator
                  style={StyleSheet.absoluteFill}
                  color={tokens.colors.primaryForeground}
                  size="large"
                  testID={`${testId}-modal-loading`}
                />
              ) : null}
              <Animated.Image
                source={{ uri: source }}
                style={[
                  fullImageSurface.style as ImageStyle | undefined,
                  {
                    transform: [{ scale }, { translateX }, { translateY }],
                  },
                ]}
                resizeMode="contain"
                onLoadEnd={() => setModalLoading(false)}
                accessibilityLabel={config.alt ?? 'Full screen image'}
              />
            </View>

            {config.alt != null ? (
              <View style={captionBarSurface.style as ViewStyle | undefined}>
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(captionTextSurface.style as TextStyle | undefined),
                  }}
                  numberOfLines={2}
                >
                  {config.alt}
                </Text>
              </View>
            ) : null}
          </View>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}

function resolveThumbnailFrame(
  tokens: ReturnType<typeof useTokens>,
  config: ImageViewerConfig,
): {
  width?: ReturnType<typeof toNativeDimensionValue>
  height?: ReturnType<typeof toNativeDimensionValue>
  borderRadius?: number
} {
  const resolvedStyle = resolveNativeStyleProps(
    {
      width: config.width,
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )

  return {
    width: toNativeDimensionValue(resolvedStyle.width),
    height: toNativeDimensionValue(resolvedStyle.height),
    borderRadius: typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : undefined,
  }
}
