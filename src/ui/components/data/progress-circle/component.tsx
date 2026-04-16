import React, { useEffect, useRef } from 'react'
import { Animated, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
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

export function ProgressCircle({ config }: { config: ProgressCircleConfig }) {
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

  const size = config.size ?? 'md'
  const diameter = SIZE_MAP[size]
  const strokeWidth = config.strokeWidth ?? defaultStrokeWidth(size)
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const fillColor =
    typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.primary
  const trackColor = config.trackColor ?? tokens.colors.border
  const innerDiameter = diameter - strokeWidth * 2

  const valueSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.value as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })
  const circularTrackSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.circularTrack as Record<string, unknown> | undefined,
  })
  const circularFillSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.circularFill as Record<string, unknown> | undefined,
  })

  const animatedValue = useRef(new Animated.Value(resolvedValue)).current

  useEffect(() => {
    if (config.animated !== false) {
      Animated.timing(animatedValue, {
        toValue: resolvedValue,
        duration: 400,
        useNativeDriver: false,
      }).start()
    } else {
      animatedValue.setValue(resolvedValue)
    }
  }, [resolvedValue, config.animated, animatedValue])

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
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : diameter <= 60
          ? tokens.typography.fontSizeSm
          : tokens.typography.fontSizeLg,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightBold,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
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
  const labelTextStyle: TextStyle = {
    marginTop: tokens.spacing[2],
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? Math.max(sharedTextStyle.fontSize - 2, tokens.typography.fontSizeSm)
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
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={{ alignItems: 'center' }}
    >
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(resolvedValue) }}
        accessibilityLabel={resolvedLabel ?? 'Progress'}
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
                borderWidth: strokeWidth,
                borderColor: trackColor,
              },
              circularTrackSurface.style as ViewStyle | undefined,
            ]}
          />

          <HalfCircle
            diameter={diameter}
            strokeWidth={strokeWidth}
            color={fillColor}
            rotation={rightRotation}
            side="right"
            style={circularFillSurface.style as ViewStyle | undefined}
          />

          <HalfCircle
            diameter={diameter}
            strokeWidth={strokeWidth}
            color={fillColor}
            rotation={leftRotation}
            side="left"
            style={circularFillSurface.style as ViewStyle | undefined}
          />

          {config.showValue !== false ? (
            <View
              style={{
                position: 'absolute',
                top: strokeWidth,
                left: strokeWidth,
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
                {Math.round(resolvedValue)}%
              </Text>
            </View>
          ) : null}
        </View>

        {resolvedLabel ? (
          <Text style={[labelTextStyle, labelSurface.style as TextStyle | undefined]}>
            {resolvedLabel}
          </Text>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
