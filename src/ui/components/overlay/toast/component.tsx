import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
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
  success: 'OK',
  error: 'X',
  warning: '!',
  info: 'i',
}

export function Toast({ config }: { config: ToastConfig }) {
  const tokens = useTokens()
  const { getValue } = useScreenContext()

  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null)
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIdRef = useRef<number | null>(null)

  const toastPayload = getValue('__toast') as ToastPayload | undefined
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (!toastPayload || toastPayload.id === lastIdRef.current) return
    lastIdRef.current = toastPayload.id

    if (dismissTimer.current) clearTimeout(dismissTimer.current)

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
  }, [config.position, opacity, toastPayload, translateY])

  if (!activeToast) {
    return null
  }

  const variantKey = VARIANT_COLORS[activeToast.variant]
  const baseTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      left: 'md',
      right: 'md',
      zIndex: 9999,
      ...(config.position === 'top' ? { top: 64 } : { bottom: 80 }),
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.toast as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      fontWeight: 'bold',
      color: variantKey.fg,
    },
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const messageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'sm',
      fontWeight: 'medium',
      color: variantKey.fg,
    },
    componentSurface: config.slots?.message as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={['open']}
    >
      <View style={containerSurface.style as ViewStyle | undefined} pointerEvents="none">
        <Animated.View style={{ transform: [{ translateY }], opacity }}>
          <View
            style={toastSurface.style as ViewStyle | undefined}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            accessible
            accessibilityLabel={`${activeToast.variant}: ${activeToast.message}`}
          >
            <Text
              style={{
                ...baseTextStyle,
                ...(iconSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
            >
              {VARIANT_ICON[activeToast.variant]}
            </Text>
            <Text
              style={{
                ...baseTextStyle,
                ...(messageSurface.style as TextStyle | undefined),
              }}
            >
              {activeToast.message}
            </Text>
          </View>
        </Animated.View>
      </View>
    </ComponentWrapper>
  )
}
