import React, { useEffect, useMemo, useRef } from 'react'
import { View, Text, Animated, StyleSheet, type DimensionValue } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeStyleProps, toNativeDimensionValue } from '../../_base'
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
  const trackFrame = useMemo(() => resolveTrackFrame(tokens, config), [config, tokens])
  const styles = makeStyles(tokens, trackFrame.height, trackFrame.borderRadius, fillColor)

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

function makeStyles(
  tokens: DesignTokens,
  height: DimensionValue,
  borderRadius: number,
  fillColor: string,
) {
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

