import React, { useEffect, useRef } from 'react'
import { Animated, Text, View, type DimensionValue, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import {
  resolveNativeStyleProps,
  resolveNativeTextStyle,
  resolveSurfacePresentation,
  toNativeDimensionValue,
} from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ProgressBarConfig } from './types'

type Variant = NonNullable<ProgressBarConfig['variant']>

function resolveVariantColor(variant: Variant, tokens: DesignTokens): string {
  switch (variant) {
    case 'success':
      return tokens.colors.success
    case 'warning':
      return tokens.colors.warning
    case 'error':
      return tokens.colors.error
    case 'default':
    default:
      return tokens.colors.primary
  }
}

export function ProgressBar({ config }: { config: ProgressBarConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? Math.min(100, Math.max(0, Number(resolveFromRef(config.value, values) ?? 0)))
    : Math.min(100, Math.max(0, config.value))
  const resolvedLabel =
    config.label == null
      ? undefined
      : isFromRef(config.label)
        ? String(resolveFromRef(config.label, values) ?? '')
        : config.label

  const animatedWidth = useRef(new Animated.Value(resolvedValue)).current

  useEffect(() => {
    if (config.animated) {
      Animated.timing(animatedWidth, {
        toValue: resolvedValue,
        duration: 400,
        useNativeDriver: false,
      }).start()
    } else {
      animatedWidth.setValue(resolvedValue)
    }
  }, [resolvedValue, config.animated, animatedWidth])

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const fillColor =
    typeof sharedTextStyle.color === 'string'
      ? sharedTextStyle.color
      : resolveVariantColor(config.variant ?? 'default', tokens)
  const trackFrame = resolveTrackFrame(tokens, config)
  const labelRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginY: 'xs',
    },
    componentSurface: config.slots?.labelRow as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })
  const valueSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.value as Record<string, unknown> | undefined,
  })
  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      height: trackFrame.height,
      borderRadius: trackFrame.borderRadius,
      backgroundColor: tokens.colors.border,
      overflow: 'hidden',
    },
    componentSurface: config.slots?.track as Record<string, unknown> | undefined,
  })
  const fillSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: '100%',
      borderRadius: trackFrame.borderRadius,
      backgroundColor: fillColor,
    },
    componentSurface: config.slots?.fill as Record<string, unknown> | undefined,
  })

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

  const labelTextStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : tokens.colors.textMuted,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightMedium,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
    flexShrink: 1,
  }
  const valueTextStyle: TextStyle = {
    ...labelTextStyle,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={{ width: '100%' }}>
        {resolvedLabel != null || config.showValue ? (
          <View style={labelRowSurface.style as ViewStyle | undefined}>
            {resolvedLabel != null ? (
              <Text style={[labelTextStyle, labelSurface.style as TextStyle | undefined]}>
                {resolvedLabel}
              </Text>
            ) : null}
            {config.showValue ? (
              <Text style={[valueTextStyle, valueSurface.style as TextStyle | undefined]}>
                {Math.round(resolvedValue)}%
              </Text>
            ) : null}
          </View>
        ) : null}
        <View
          style={trackSurface.style as ViewStyle | undefined}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(resolvedValue) }}
          accessibilityLabel={resolvedLabel}
        >
          <Animated.View
            style={[
              fillSurface.style as ViewStyle | undefined,
              { width: widthInterpolated } as unknown as ViewStyle,
            ]}
          />
        </View>
      </View>
    </ComponentWrapper>
  )
}

function resolveTrackFrame(tokens: DesignTokens, config: ProgressBarConfig): {
  height: DimensionValue
  borderRadius: number
} {
  const resolvedStyle = resolveNativeStyleProps(
    {
      height: config.height,
      borderRadius: config.borderRadius,
    },
    tokens,
  )

  return {
    height: toNativeDimensionValue(resolvedStyle.height) ?? 8,
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number'
        ? resolvedStyle.borderRadius
        : tokens.radius.full,
  }
}
