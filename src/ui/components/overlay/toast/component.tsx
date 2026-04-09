import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ToastConfig, ToastPayload } from './types'

const VARIANT_COLORS: Record<
  ToastPayload['variant'],
  { bg: keyof DesignTokens['colors']; fg: keyof DesignTokens['colors'] }
> = {
  success: { bg: 'success', fg: 'successForeground' },
  error: { bg: 'error', fg: 'errorForeground' },
  warning: { bg: 'warning', fg: 'warningForeground' },
  info: { bg: 'info', fg: 'infoForeground' },
}

const VARIANT_ICON: Record<ToastPayload['variant'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

function makeStyles(tokens: DesignTokens, position: ToastConfig['position'], payload: ToastPayload) {
  const variantKey = VARIANT_COLORS[payload.variant]
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: tokens.spacing[4],
      right: tokens.spacing[4],
      ...(position === 'top' ? { top: 60 } : { bottom: 80 }),
      zIndex: 9999,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors[variantKey.bg],
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      gap: tokens.spacing[2],
      ...tokens.shadows.md,
    },
    icon: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors[variantKey.fg],
    },
    message: {
      flex: 1,
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors[variantKey.fg],
    },
  })
}

/**
 * Config-driven toast notification. Place once at the root of each screen.
 *
 * Watches `__toast` in ScreenContext. When a toast action fires, this component
 * slides in from the configured position, then auto-dismisses after the duration.
 */
export function Toast({ config }: { config: ToastConfig }) {
  const tokens = useTokens()
  const { getValue } = useScreenContext()

  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null)
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIdRef = useRef<number | null>(null)

  const toastPayload = getValue('__toast') as ToastPayload | undefined

  useEffect(() => {
    if (!toastPayload || toastPayload.id === lastIdRef.current) return
    lastIdRef.current = toastPayload.id

    // Clear any pending dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current)

    // Reset position
    const startY = config.position === 'top' ? -60 : 60
    translateY.setValue(startY)
    opacity.setValue(0)

    setActiveToast(toastPayload)

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    dismissTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: config.position === 'top' ? -60 : 60,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveToast(null)
      })
    }, toastPayload.duration)

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [toastPayload, config.position, translateY, opacity])

  if (!activeToast) return null

  const styles = makeStyles(tokens, config.position, activeToast)

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <View
          style={styles.toast}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessible
          accessibilityLabel={`${activeToast.variant}: ${activeToast.message}`}
        >
          <Text style={styles.icon} accessibilityElementsHidden>
            {VARIANT_ICON[activeToast.variant]}
          </Text>
          <Text style={styles.message}>{activeToast.message}</Text>
        </View>
      </Animated.View>
    </View>
  )
}
