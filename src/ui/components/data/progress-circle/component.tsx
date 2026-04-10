import React, { useEffect, useMemo, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ProgressCircleConfig } from './types'

type Size = NonNullable<ProgressCircleConfig['size']>

const SIZE_MAP: Record<Size, number> = { sm: 60, md: 100, lg: 140 }

function defaultStrokeWidth(size: Size): number {
  switch (size) {
    case 'sm':
      return 5
    case 'md':
      return 8
    case 'lg':
      return 10
  }
}

/**
 * Renders a single half-circle clipped to one side.
 *
 * The technique: a View of full circle size is clipped by a parent with half
 * the width and overflow:hidden. Rotating the inner circle reveals a portion
 * of the stroke arc on that side.
 */
function HalfCircle({
  diameter,
  strokeWidth,
  color,
  rotation,
  side,
}: {
  diameter: number
  strokeWidth: number
  color: string
  rotation: Animated.AnimatedInterpolation<string>
  side: 'left' | 'right'
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
        style={{
          width: diameter,
          height: diameter,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: color,
          position: 'absolute',
          top: 0,
          left: side === 'left' ? 0 : -half,
          transform: [{ rotate: rotation }],
        }}
      />
    </View>
  )
}

export function ProgressCircle({ config }: { config: ProgressCircleConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? Math.min(100, Math.max(0, Number(resolveFromRef(config.value, values) ?? 0)))
    : Math.min(100, Math.max(0, config.value))

  const size = config.size ?? 'md'
  const diameter = SIZE_MAP[size]
  const strokeWidth = config.strokeWidth ?? defaultStrokeWidth(size)
  const fillColor = config.color ?? tokens.colors.primary
  const trackColor = config.trackColor ?? tokens.colors.border

  const animatedValue = useRef(new Animated.Value(resolvedValue)).current

  useEffect(() => {
    if (config.animated !== false) {
      Animated.timing(animatedValue, {
        toValue: resolvedValue,
        duration: 400,
        useNativeDriver: false, // transform rotate with interpolation requires JS driver for this technique
      }).start()
    } else {
      animatedValue.setValue(resolvedValue)
    }
  }, [resolvedValue, config.animated, animatedValue])

  // Right half: covers 0-50%. Rotates from 0deg (nothing visible) to 180deg (full right half).
  const rightRotation = animatedValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  })

  // Left half: covers 50-100%. Rotates from 0deg to 180deg.
  const leftRotation = animatedValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  })

  const styles = useMemo(() => makeStyles(tokens, diameter, strokeWidth), [tokens, diameter, strokeWidth])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View
        style={styles.wrapper}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(resolvedValue) }}
        accessibilityLabel={config.label ?? 'Progress'}
      >
        <View style={styles.circleContainer}>
          {/* Track (background ring) */}
          <View
            style={[
              styles.track,
              { borderColor: trackColor },
            ]}
          />

          {/* Right half-circle (0-50%) */}
          <HalfCircle
            diameter={diameter}
            strokeWidth={strokeWidth}
            color={fillColor}
            rotation={rightRotation}
            side="right"
          />

          {/* Left half-circle (50-100%) */}
          <HalfCircle
            diameter={diameter}
            strokeWidth={strokeWidth}
            color={fillColor}
            rotation={leftRotation}
            side="left"
          />

          {/* Center content */}
          {config.showValue !== false ? (
            <View style={styles.center}>
              <Text
                style={styles.valueText}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {Math.round(resolvedValue)}%
              </Text>
            </View>
          ) : null}
        </View>

        {config.label != null ? (
          <Text style={styles.label}>{config.label}</Text>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, diameter: number, strokeWidth: number) {
  const innerDiameter = diameter - strokeWidth * 2

  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
    },
    circleContainer: {
      width: diameter,
      height: diameter,
    },
    track: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      borderWidth: strokeWidth,
    },
    center: {
      position: 'absolute',
      top: strokeWidth,
      left: strokeWidth,
      width: innerDiameter,
      height: innerDiameter,
      borderRadius: innerDiameter / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    valueText: {
      fontSize: diameter <= 60 ? tokens.typography.fontSizeSm : tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.text,
    },
    label: {
      marginTop: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
      textAlign: 'center',
    },
  })
}
