import React, { useCallback } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { StatCardConfig } from './types'

export function StatCard({ config }: { config: StatCardConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? String(resolveFromRef(config.value, values) ?? '')
    : String(config.value)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const trendColor =
    config.trend?.direction === 'up'
      ? tokens.colors.success
      : config.trend?.direction === 'down'
        ? tokens.colors.error
        : tokens.colors.textMuted

  const trendIcon =
    config.trend?.direction === 'up' ? '↑' : config.trend?.direction === 'down' ? '↓' : '→'

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      ...tokens.shadows.md,
    },
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })
  const valueRowSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.valueRow as Record<string, unknown> | undefined,
  })
  const valueSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.value as Record<string, unknown> | undefined,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.icon as Record<string, unknown> | undefined,
  })
  const trendSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.trend as Record<string, unknown> | undefined,
  })

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[1],
  }
  const valueRowStyle: ViewStyle = {
    marginBottom: config.trend ? tokens.spacing[1] : 0,
  }
  const trendRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }
  const labelStyle: TextStyle = {
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
  const valueStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? Math.max(sharedTextStyle.fontSize, tokens.typography.fontSize3xl)
        : tokens.typography.fontSize3xl,
    color:
      typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : tokens.colors.text,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightBold,
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
  const iconStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeLg,
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
    marginRight: tokens.spacing[2],
  }
  const trendStyle: TextStyle = {
    fontSize:
      typeof sharedTextStyle.fontSize === 'number'
        ? sharedTextStyle.fontSize
        : tokens.typography.fontSizeSm,
    color: trendColor,
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
  }

  const inner = (
    <View style={rootSurface.style as ViewStyle | undefined}>
      <View style={headerStyle}>
        {config.icon ? (
          <Text
            style={[iconStyle, iconSurface.style as TextStyle | undefined]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {config.icon}
          </Text>
        ) : null}
        <Text style={[labelStyle, labelSurface.style as TextStyle | undefined]}>{config.label}</Text>
      </View>
      <View style={[valueRowStyle, valueRowSurface.style as ViewStyle | undefined]}>
        <Text
          style={[valueStyle, valueSurface.style as TextStyle | undefined]}
          accessibilityLabel={`${config.label}: ${resolvedValue}`}
        >
          {resolvedValue}
        </Text>
      </View>
      {config.trend ? (
        <View style={trendRowStyle}>
          <Text style={[trendStyle, trendSurface.style as TextStyle | undefined]}>
            {trendIcon} {config.trend.value}
          </Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`${config.label} stat card`}
          accessibilityHint="Tap to view details"
        >
          {inner}
        </TouchableOpacity>
      ) : (
        inner
      )}
    </ComponentWrapper>
  )
}
