import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ProgressBarConfig } from './types'

type Variant = NonNullable<ProgressBarConfig['variant']>
type Radius = NonNullable<ProgressBarConfig['radius']>

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

function resolveRadius(radius: Radius, tokens: DesignTokens): number {
  switch (radius) {
    case 'none':
      return tokens.radius.none
    case 'sm':
      return tokens.radius.sm
    case 'md':
      return tokens.radius.md
    case 'full':
    default:
      return tokens.radius.full
  }
}

export function ProgressBar({ config }: { config: ProgressBarConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? Math.min(100, Math.max(0, Number(resolveFromRef(config.value, values) ?? 0)))
    : Math.min(100, Math.max(0, config.value))

  const animatedWidth = useRef(new Animated.Value(resolvedValue)).current

  useEffect(() => {
    if (config.animated) {
      Animated.timing(animatedWidth, {
        toValue: resolvedValue,
        duration: 400,
        useNativeDriver: false, // width is a layout property — cannot use native driver
      }).start()
    } else {
      animatedWidth.setValue(resolvedValue)
    }
  }, [resolvedValue, config.animated, animatedWidth])

  const fillColor = resolveVariantColor(config.variant ?? 'default', tokens)
  const borderRadius = resolveRadius(config.radius ?? 'full', tokens)

  const styles = makeStyles(tokens, config.height ?? 8, borderRadius, fillColor)

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.wrapper}>
        {config.label != null || config.showValue ? (
          <View style={styles.labelRow}>
            {config.label != null ? <Text style={styles.label}>{config.label}</Text> : null}
            {config.showValue ? (
              <Text style={styles.valueText}>{Math.round(resolvedValue)}%</Text>
            ) : null}
          </View>
        ) : null}
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(resolvedValue) }}
          accessibilityLabel={config.label}
        >
          <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, height: number, borderRadius: number, fillColor: string) {
  return StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
      flexShrink: 1,
    },
    valueText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    track: {
      width: '100%',
      height,
      borderRadius,
      backgroundColor: tokens.colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius,
      backgroundColor: fillColor,
    },
  })
}

