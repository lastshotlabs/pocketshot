import React, { useEffect, useMemo, useRef } from 'react'
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
import type { LoadingStateConfig } from './types'

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

export function LoadingState({ config }: { config: LoadingStateConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const resolvedLabel =
    config.label == null
      ? undefined
      : isFromRef(config.label)
        ? String(resolveFromRef(config.label, values) ?? '')
        : config.label
  const skeletonFrame = useMemo(() => resolveLoadingSkeletonFrame(tokens, config), [config, tokens])
  const spinnerSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.spinner as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })
  const lineSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.line as Record<string, unknown> | undefined,
  })

  const labelTextStyle: TextStyle = {
    marginBottom: tokens.spacing[2],
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
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : 'center',
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.variant === 'spinner' ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing[8],
          }}
          accessibilityLabel="Loading"
          accessibilityRole="progressbar"
        >
          <View style={spinnerSurface.style as ViewStyle | undefined}>
            <ActivityIndicator
              size="large"
              color={tokens.colors.primary}
              accessibilityElementsHidden
            />
          </View>
          {resolvedLabel ? (
            <Text style={[labelTextStyle, labelSurface.style as TextStyle | undefined]}>
              {resolvedLabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <SkeletonRows
          count={config.count ?? 3}
          height={skeletonFrame.height}
          borderRadius={skeletonFrame.borderRadius}
          tokens={tokens}
          lineStyle={lineSurface.style as ViewStyle | undefined}
          label={resolvedLabel}
          labelStyle={[labelTextStyle, labelSurface.style as TextStyle | undefined]}
        />
      )}
    </ComponentWrapper>
  )
}

function resolveLoadingSkeletonFrame(tokens: DesignTokens, config: LoadingStateConfig): {
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
    height: toNativeDimensionValue(resolvedStyle.height) ?? 48,
    borderRadius:
      typeof resolvedStyle.borderRadius === 'number' ? resolvedStyle.borderRadius : tokens.radius.md,
  }
}
