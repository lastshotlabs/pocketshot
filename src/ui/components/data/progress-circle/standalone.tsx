import React, { useEffect, useRef } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type ProgressCircleSize = 'sm' | 'md' | 'lg'

export interface ProgressCircleBaseProps {
  /** Progress value 0-100. */
  value: number
  /** Optional label below the ring. */
  label?: string
  /** Size token. */
  size?: ProgressCircleSize
  /** Stroke thickness. Defaults derived from size. */
  strokeWidth?: number
  /** Track color (background ring). */
  trackColor?: string
  /** Whether to show the value text in the center. */
  showValue?: boolean
  /** Whether to animate value transitions. */
  animated?: boolean
  /** Slot overrides (value, label, circularTrack, circularFill). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const SIZE_MAP: Record<ProgressCircleSize, number> = { sm: 60, md: 100, lg: 140 }

function defaultStrokeWidth(size: ProgressCircleSize): number {
  switch (size) {
    case 'sm':
      return 5
    case 'md':
      return 8
    case 'lg':
      return 10
  }
}

function HalfCircle({
  diameter,
  strokeWidth,
  color,
  rotation,
  side,
  style,
}: {
  diameter: number
  strokeWidth: number
  color: string
  rotation: Animated.AnimatedInterpolation<string>
  side: 'left' | 'right'
  style?: ViewStyle
}) {
  const half = diameter / 2

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: side === 'left' ? 0 : half,
        width: half,
        height: diameter,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            width: diameter,
            height: diameter,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: color,
            position: 'absolute',
            top: 0,
            left: side === 'left' ? 0 : -half,
            transform: [{ rotate: rotation }],
          },
          style,
        ]}
      />
    </View>
  )
}

/**
 * Standalone ProgressCircle — plain React props, no manifest required.
 *
 * @example
 * <ProgressCircleBase value={62} label="Progress" />
 */
export function ProgressCircleBase({
  value,
  label,
  size = 'md',
  strokeWidth,
  trackColor,
  showValue = true,
  animated = true,
  slots,
  style,
  testID,
}: ProgressCircleBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const clamped = Math.min(100, Math.max(0, value))
  const diameter = SIZE_MAP[size]
  const stroke = strokeWidth ?? defaultStrokeWidth(size)
  const fillColor = tokens.colors.primary
  const resolvedTrackColor = trackColor ?? tokens.colors.border
  const innerDiameter = diameter - stroke * 2

  const valueSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.value })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })
  const circularTrackSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.circularTrack,
  })
  const circularFillSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.circularFill,
  })

  const animatedValue = useRef(new Animated.Value(clamped)).current

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: clamped,
        duration: 400,
        useNativeDriver: false,
      }).start()
    } else {
      animatedValue.setValue(clamped)
    }
  }, [clamped, animated, animatedValue])

  const rightRotation = animatedValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  })
  const leftRotation = animatedValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  })

  const valueTextStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: diameter <= 60 ? tokens.typography.fontSizeSm : tokens.typography.fontSizeLg,
    fontWeight: tokens.typography.fontWeightBold,
    color: tokens.colors.text,
  }
  const labelTextStyle: TextStyle = {
    ...sharedTextStyle,
    marginTop: tokens.spacing[2],
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightMedium,
    textAlign: 'center',
  }

  return (
    <View
      style={[{ alignItems: 'center' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      accessibilityLabel={label ?? 'Progress'}
      testID={testID}
    >
      <View style={{ width: diameter, height: diameter }}>
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              borderWidth: stroke,
              borderColor: resolvedTrackColor,
            },
            circularTrackSurface.style as ViewStyle | undefined,
          ]}
        />

        <HalfCircle
          diameter={diameter}
          strokeWidth={stroke}
          color={fillColor}
          rotation={rightRotation}
          side="right"
          style={circularFillSurface.style as ViewStyle | undefined}
        />

        <HalfCircle
          diameter={diameter}
          strokeWidth={stroke}
          color={fillColor}
          rotation={leftRotation}
          side="left"
          style={circularFillSurface.style as ViewStyle | undefined}
        />

        {showValue ? (
          <View
            style={{
              position: 'absolute',
              top: stroke,
              left: stroke,
              width: innerDiameter,
              height: innerDiameter,
              borderRadius: innerDiameter / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[valueTextStyle, valueSurface.style as TextStyle | undefined]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {Math.round(clamped)}%
            </Text>
          </View>
        ) : null}
      </View>

      {label ? (
        <Text style={[labelTextStyle, labelSurface.style as TextStyle | undefined]}>{label}</Text>
      ) : null}
    </View>
  )
}
