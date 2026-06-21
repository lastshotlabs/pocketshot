import React, { useEffect, useRef } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top' | 'bottom'

const VARIANT_COLORS: Record<
  ToastVariant,
  { bg: keyof DesignTokens['colors']; fg: keyof DesignTokens['colors'] }
> = {
  success: { bg: 'success', fg: 'successForeground' },
  error: { bg: 'error', fg: 'errorForeground' },
  warning: { bg: 'warning', fg: 'warningForeground' },
  info: { bg: 'info', fg: 'infoForeground' },
}

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: 'OK',
  error: 'X',
  warning: '!',
  info: 'i',
}

export interface ToastBaseProps {
  /** Whether the toast is visible. */
  visible: boolean
  /** Toast message. */
  message: string
  /** Toast variant. */
  variant?: ToastVariant
  /** Position on screen. */
  position?: ToastPosition
  /** Auto-dismiss duration (ms). Set to 0 to disable. */
  duration?: number
  /** Called when the toast auto-dismisses or is dismissed. */
  onDismiss?: () => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone Toast — plain React props, no manifest required.
 *
 * @example
 * <ToastBase visible message="Saved!" variant="success" duration={3000} onDismiss={...} />
 */
export function ToastBase({
  visible,
  message,
  variant = 'info',
  position = 'bottom',
  duration = 3000,
  onDismiss,
  style,
  slots,
  testID,
  id,
}: ToastBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) return

    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    const startY = position === 'top' ? -60 : 60
    translateY.setValue(startY)
    opacity.setValue(0)

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    if (duration > 0) {
      dismissTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: position === 'top' ? -60 : 60,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => {
          onDismiss?.()
        })
      }, duration)
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [visible, position, duration, translateY, opacity, onDismiss])

  if (!visible) return null

  const variantKey = VARIANT_COLORS[variant]

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      left: 'md',
      right: 'md',
      zIndex: 9999,
      ...(position === 'top' ? { top: 64 } : { bottom: 80 }),
    },
    componentSurface: slots?.container,
  })
  const toastSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: variantKey.bg,
      borderRadius: 'md',
      paddingX: 'md',
      paddingY: 'sm',
      gap: 'xs',
      shadow: 'md',
    },
    componentSurface: slots?.toast,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', fontWeight: 'bold', color: variantKey.fg },
    componentSurface: slots?.icon,
  })
  const messageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'sm',
      fontWeight: 'medium',
      color: variantKey.fg,
    },
    componentSurface: slots?.message,
  })

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      pointerEvents="none"
      testID={testID ?? id}
    >
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <View
          style={toastSurface.style as ViewStyle | undefined}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessible
          accessibilityLabel={`${variant}: ${message}`}
        >
          <Text
            style={{
              ...sharedTextStyle,
              ...(iconSurface.style as TextStyle | undefined),
            }}
            accessibilityElementsHidden
          >
            {VARIANT_ICON[variant]}
          </Text>
          <Text
            style={{
              ...sharedTextStyle,
              ...(messageSurface.style as TextStyle | undefined),
            }}
          >
            {message}
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}
