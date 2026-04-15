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
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNativeDimensionValue } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
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
  const thumbnailFrame = useMemo(() => resolveThumbnailFrame(tokens, config), [config, tokens])
  const imageWidth = thumbnailFrame.width ?? SCREEN.width
  const imageHeight = thumbnailFrame.height ?? SCREEN.width * 0.75

  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(true)

  // Animation values for the full-screen viewer
  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  // Tracking state for gestures
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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Respond to two-finger gestures or single-finger pan when zoomed
        return (
          Math.abs(gestureState.dx) > 2 ||
          Math.abs(gestureState.dy) > 2
        )
      },
      onPanResponderGrant: (evt) => {
        const now = Date.now()
        if (evt.nativeEvent.touches.length === 1 && now - lastTap.current < DOUBLE_TAP_DELAY) {
          handleDoubleTap()
        }
        lastTap.current = now

        if (evt.nativeEvent.touches.length === 2) {
          const touches = evt.nativeEvent.touches
          const dx = touches[0].pageX - touches[1].pageX
          const dy = touches[0].pageY - touches[1].pageY
          pinchDistance.current = Math.sqrt(dx * dx + dy * dy)
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const touches = evt.nativeEvent.touches
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
          // Pan when zoomed in
          translateX.setValue(gestureState.dx)
          translateY.setValue(gestureState.dy)
        } else if (gestureState.dy > 60) {
          // Swipe down to dismiss
          setModalVisible(false)
          resetTransform()
        }
      },
      onPanResponderRelease: (evt) => {
        if (evt.nativeEvent.touches.length < 2 && pinchDistance.current > 0) {
          // Pinch ended — save current scale
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

  const styles = useMemo(() => makeStyles(tokens, thumbnailFrame.borderRadius), [tokens, thumbnailFrame.borderRadius])
  const testId = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View testID={testId}>
        {/* Inline thumbnail */}
        <TouchableOpacity
          onPress={handleOpenModal}
          activeOpacity={0.9}
          accessibilityRole="image"
          accessibilityLabel={config.alt ?? 'Image'}
          accessibilityHint="Tap to view full screen"
          testID={`${testId}-thumbnail`}
        >
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            {loading && (
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                color={tokens.colors.primary}
                testID={`${testId}-loading`}
              />
            )}
            <Image
              source={{ uri: source }}
              style={{
                width: imageWidth,
                height: imageHeight,
                ...(thumbnailFrame.borderRadius != null
                  ? { borderRadius: thumbnailFrame.borderRadius }
                  : undefined),
              }}
              resizeMode="cover"
              onLoadEnd={() => setLoading(false)}
              accessibilityLabel={config.alt ?? 'Image'}
            />
          </View>
        </TouchableOpacity>

        {/* Full-screen modal viewer */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseModal}
          statusBarTranslucent
        >
          <View style={styles.modalBackdrop}>
            {showCloseButton && (
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close image viewer"
                testID={`${testId}-close`}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>{'\u2715'}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalContent} {...(panResponder?.panHandlers ?? {})}>
              {modalLoading && (
                <ActivityIndicator
                  style={StyleSheet.absoluteFill}
                  color={tokens.colors.primaryForeground}
                  size="large"
                  testID={`${testId}-modal-loading`}
                />
              )}
              <Animated.Image
                source={{ uri: source }}
                style={[
                  styles.fullImage,
                  {
                    transform: [
                      { scale },
                      { translateX },
                      { translateY },
                    ],
                  },
                ]}
                resizeMode="contain"
                onLoadEnd={() => setModalLoading(false)}
                accessibilityLabel={config.alt ?? 'Full screen image'}
              />
            </View>

            {config.alt != null && (
              <View style={styles.captionBar}>
                <Text style={styles.captionText} numberOfLines={2}>
                  {config.alt}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, borderRadius?: number) {
  return StyleSheet.create({
    imageContainer: {
      borderRadius: borderRadius ?? tokens.radius.md,
      overflow: 'hidden',
      backgroundColor: tokens.colors.surfaceAlt,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 56,
      right: tokens.spacing[4],
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: tokens.radius.full,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      color: '#ffffff',
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightBold,
    },
    modalContent: {
      flex: 1,
      width: SCREEN.width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullImage: {
      width: SCREEN.width,
      height: SCREEN.height * 0.75,
    },
    captionBar: {
      position: 'absolute',
      bottom: 48,
      left: 0,
      right: 0,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[2],
      alignItems: 'center',
    },
    captionText: {
      color: '#ffffff',
      fontSize: tokens.typography.fontSizeSm,
      textAlign: 'center',
    },
  })
}

function resolveThumbnailFrame(tokens: DesignTokens, config: ImageViewerConfig): {
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
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : undefined,
  }
}

