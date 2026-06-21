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
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

const SCREEN = Dimensions.get('window')
const DOUBLE_TAP_DELAY = 300

export interface ImageViewerBaseProps {
  /** Image URL. */
  source: string
  /** Accessible alt text used for both thumbnail and full screen. */
  alt?: string
  /** Enable pinch-to-zoom and pan in the modal (default true). */
  enableZoom?: boolean
  /** Maximum zoom factor. */
  maxZoom?: number
  /** Show the close button in the modal (default true). */
  showCloseButton?: boolean
  /** Width of the thumbnail. */
  width?: number
  /** Height of the thumbnail. */
  height?: number
  /** Border radius applied to thumbnail and full image surface. */
  borderRadius?: number
  /** Style applied to the thumbnail container. */
  style?: ViewStyle
  /** Slot overrides keyed by slot name. */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone ImageViewer — plain React props, no manifest required.
 *
 * @example
 * <ImageViewerBase source="https://…/large.jpg" alt="Sunset" width={300} height={200} />
 */
export function ImageViewerBase({
  source,
  alt,
  enableZoom = true,
  maxZoom = 3,
  showCloseButton = true,
  width,
  height,
  borderRadius,
  style,
  slots,
  testID,
  id,
}: ImageViewerBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const imageWidth = width ?? SCREEN.width
  const imageHeight = height ?? SCREEN.width * 0.75

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
      borderRadius: borderRadius ?? 'md',
      overflow: 'hidden',
      bg: 'muted',
    },
    componentSurface: slots?.thumbnailContainer,
  })
  const thumbnailImageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: imageWidth,
      height: imageHeight,
      ...(borderRadius != null ? { borderRadius } : undefined),
    },
    componentSurface: slots?.thumbnailImage,
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
    componentSurface: slots?.modalBackdrop,
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
    componentSurface: slots?.closeButton,
  })
  const closeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: '#ffffff',
      fontSize: 'lg',
      fontWeight: 'bold',
    },
    componentSurface: slots?.closeButtonText,
  })
  const modalContentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      width: SCREEN.width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    componentSurface: slots?.modalContent,
  })
  const fullImageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: SCREEN.width,
      height: SCREEN.height * 0.75,
    },
    componentSurface: slots?.fullImage,
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
    componentSurface: slots?.captionBar,
  })
  const captionTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      color: '#ffffff',
      fontSize: 'sm',
      textAlign: 'center',
    },
    componentSurface: slots?.captionText,
  })

  const testId = testID ?? id

  return (
    <View testID={testId} style={style}>
      <TouchableOpacity
        onPress={handleOpenModal}
        activeOpacity={0.9}
        accessibilityRole="image"
        accessibilityLabel={alt ?? 'Image'}
        accessibilityHint="Tap to view full screen"
        testID={testId ? `${testId}-thumbnail` : undefined}
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
              testID={testId ? `${testId}-loading` : undefined}
            />
          ) : null}
          <Image
            source={{ uri: source }}
            style={thumbnailImageSurface.style as ImageStyle | undefined}
            resizeMode="cover"
            onLoadEnd={() => setLoading(false)}
            accessibilityLabel={alt ?? 'Image'}
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
              testID={testId ? `${testId}-close` : undefined}
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
                testID={testId ? `${testId}-modal-loading` : undefined}
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
              accessibilityLabel={alt ?? 'Full screen image'}
            />
          </View>

          {alt != null ? (
            <View style={captionBarSurface.style as ViewStyle | undefined}>
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(captionTextSurface.style as TextStyle | undefined),
                }}
                numberOfLines={2}
              >
                {alt}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  )
}
