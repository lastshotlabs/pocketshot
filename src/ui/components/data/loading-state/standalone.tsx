import React, { useEffect, useRef } from 'react'
import {
  ActivityIndicator,
  Animated,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type LoadingStateVariant = 'spinner' | 'skeleton'

export interface LoadingStateBaseProps {
  /** Visual variant. */
  variant?: LoadingStateVariant
  /** Optional caption shown alongside the loader. */
  label?: string
  /** Number of skeleton rows. */
  count?: number
  /** Skeleton row height (number or DimensionValue). */
  height?: DimensionValue
  /** Skeleton row border radius. */
  borderRadius?: number
  /** Slot overrides (spinner, label, line). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function SkeletonRows({
  count,
  height,
  borderRadius,
  tokens,
  lineStyle,
  label,
  labelStyle,
}: {
  count: number
  height: DimensionValue
  borderRadius: number
  tokens: DesignTokens
  lineStyle?: ViewStyle
  label?: string
  labelStyle?: StyleProp<TextStyle>
}) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <View
      style={{
        paddingHorizontal: tokens.spacing[4],
        paddingTop: tokens.spacing[2],
      }}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      importantForAccessibility="yes"
    >
      {label ? <Text style={labelStyle}>{label}</Text> : null}
      {Array.from({ length: count }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              height,
              borderRadius,
              backgroundColor: tokens.colors.surfaceAlt,
              marginBottom: tokens.spacing[3],
              opacity,
            },
            lineStyle,
          ]}
        />
      ))}
    </View>
  )
}

/**
 * Standalone LoadingState — plain React props, no manifest required.
 *
 * @example
 * <LoadingStateBase variant="spinner" label="Loading…" />
 */
export function LoadingStateBase({
  variant = 'skeleton',
  label,
  count = 3,
  height,
  borderRadius,
  slots,
  style,
  testID,
}: LoadingStateBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const spinnerSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.spinner })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })
  const lineSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.line })

  const labelTextStyle: TextStyle = {
    ...sharedTextStyle,
    marginBottom: tokens.spacing[2],
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightMedium,
    textAlign: 'center',
  }

  const resolvedHeight: DimensionValue = height ?? 48
  const resolvedRadius = borderRadius ?? tokens.radius.md

  if (variant === 'spinner') {
    return (
      <View
        style={[
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing[8],
          },
          style,
        ]}
        accessibilityLabel="Loading"
        accessibilityRole="progressbar"
        testID={testID}
      >
        <View style={spinnerSurface.style as ViewStyle | undefined}>
          <ActivityIndicator
            size="large"
            color={tokens.colors.primary}
            accessibilityElementsHidden
          />
        </View>
        {label ? (
          <Text style={[labelTextStyle, labelSurface.style as TextStyle | undefined]}>{label}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={style} testID={testID}>
      <SkeletonRows
        count={count}
        height={resolvedHeight}
        borderRadius={resolvedRadius}
        tokens={tokens}
        lineStyle={lineSurface.style as ViewStyle | undefined}
        label={label}
        labelStyle={[labelTextStyle, labelSurface.style as TextStyle | undefined]}
      />
    </View>
  )
}
