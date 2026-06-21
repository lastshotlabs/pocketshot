import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Text,
  View,
  type DimensionValue,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveNativeStyleProps } from '../../_base/style-props'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { toNativeDimensionValue } from '../../_base/dimensions'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error'

function resolveVariantColor(variant: ProgressBarVariant, tokens: DesignTokens): string {
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

export interface ProgressBarBaseProps {
  /** Value 0-100. */
  value: number
  variant?: ProgressBarVariant
  label?: string
  showValue?: boolean
  animated?: boolean
  height?: string | number
  borderRadius?: string | number
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone ProgressBar — plain React props, no manifest required.
 *
 * @example
 * <ProgressBarBase value={64} label="Uploading" showValue animated />
 */
export function ProgressBarBase({
  value,
  variant = 'default',
  label,
  showValue,
  animated,
  height,
  borderRadius,
  style,
  slots,
  testID,
  id,
}: ProgressBarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const clampedValue = Math.min(100, Math.max(0, value))

  const animatedWidth = useRef(new Animated.Value(clampedValue)).current

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedValue,
        duration: 400,
        useNativeDriver: false,
      }).start()
    } else {
      animatedWidth.setValue(clampedValue)
    }
  }, [clampedValue, animated, animatedWidth])

  const fillColor = resolveVariantColor(variant, tokens)
  const trackFrame = resolveTrackFrame(tokens, height, borderRadius)
  const labelRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginY: 'xs',
    },
    componentSurface: slots?.labelRow,
  })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })
  const valueSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.value })
  const trackSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      height: trackFrame.height,
      borderRadius: trackFrame.borderRadius,
      backgroundColor: tokens.colors.border,
      overflow: 'hidden',
    },
    componentSurface: slots?.track,
  })
  const fillSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      height: '100%',
      borderRadius: trackFrame.borderRadius,
      backgroundColor: fillColor,
    },
    componentSurface: slots?.fill,
  })

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

  const labelTextStyle: TextStyle = {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightMedium,
    flexShrink: 1,
  }

  return (
    <View style={[{ width: '100%' }, style]} testID={testID ?? id}>
      {label != null || showValue ? (
        <View style={labelRowSurface.style as ViewStyle | undefined}>
          {label != null ? (
            <Text
              style={[labelTextStyle, labelSurface.style as TextStyle | undefined, sharedTextStyle]}
            >
              {label}
            </Text>
          ) : null}
          {showValue ? (
            <Text
              style={[labelTextStyle, valueSurface.style as TextStyle | undefined, sharedTextStyle]}
            >
              {Math.round(clampedValue)}%
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        style={trackSurface.style as ViewStyle | undefined}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedValue) }}
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            fillSurface.style as ViewStyle | undefined,
            { width: widthInterpolated } as unknown as ViewStyle,
          ]}
        />
      </View>
    </View>
  )
}

function resolveTrackFrame(
  tokens: DesignTokens,
  height?: string | number,
  borderRadius?: string | number,
): { height: DimensionValue; borderRadius: number } {
  const resolvedStyle = resolveNativeStyleProps({ height, borderRadius }, tokens)
  return {
    height: toNativeDimensionValue(resolvedStyle.height) ?? 8,
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number'
        ? resolvedStyle.borderRadius
        : tokens.radius.full,
  }
}
