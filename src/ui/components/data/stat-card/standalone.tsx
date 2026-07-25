import React from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type StatCardTrendDirection = 'up' | 'down' | 'flat'

export interface StatCardTrend {
  value: string
  direction: StatCardTrendDirection
}

export interface StatCardBaseProps {
  /** Field label (caption above the value). */
  label: string
  /** Primary stat value (rendered as a string). */
  value: string | number
  /** Optional small icon glyph next to the label. */
  icon?: string
  /** Optional trend (with directional arrow + label). */
  trend?: StatCardTrend
  /** Press handler — wraps the card in a TouchableOpacity. */
  onPress?: () => void
  /** Slot overrides (root, label, icon, valueRow, value, trend). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone StatCard — plain React props, no manifest required.
 *
 * @example
 * <StatCardBase label="Revenue" value="$3,200" trend={{ value: "12%", direction: "up" }} />
 */
export function StatCardBase({
  label,
  value,
  icon,
  trend,
  onPress,
  slots,
  style,
  testID,
}: StatCardBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const resolvedValue = String(value)

  const trendColor =
    trend?.direction === 'up'
      ? tokens.colors.success
      : trend?.direction === 'down'
        ? tokens.colors.error
        : tokens.colors.textMuted
  const trendIcon = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→'

  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing[4],
      ...tokens.shadows.md,
    },
    componentSurface: slots?.root,
  })
  const labelSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.label })
  const valueRowSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.valueRow })
  const valueSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.value })
  const iconSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.icon })
  const trendSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.trend })

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[1],
  }
  const valueRowStyle: ViewStyle = { marginBottom: trend ? tokens.spacing[1] : 0 }
  const trendRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center' }
  const labelStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeightMedium,
    flexShrink: 1,
  }
  const valueStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSize3xl,
    color: tokens.colors.text,
    fontWeight: tokens.typography.fontWeightBold,
  }
  const iconStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeLg,
    color: tokens.colors.text,
    marginRight: tokens.spacing[2],
  }
  const trendStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: tokens.typography.fontSizeSm,
    color: trendColor,
    fontWeight: tokens.typography.fontWeightMedium,
  }

  const inner = (
    <View style={[rootSurface.style as ViewStyle | undefined, style]} testID={testID}>
      <View style={headerStyle}>
        {icon ? (
          <Text
            style={[iconStyle, iconSurface.style as TextStyle | undefined]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {icon}
          </Text>
        ) : null}
        <Text style={[labelStyle, labelSurface.style as TextStyle | undefined]}>{label}</Text>
      </View>
      <View style={[valueRowStyle, valueRowSurface.style as ViewStyle | undefined]}>
        <Text
          style={[valueStyle, valueSurface.style as TextStyle | undefined]}
          accessibilityLabel={`${label}: ${resolvedValue}`}
        >
          {resolvedValue}
        </Text>
      </View>
      {trend ? (
        <View style={trendRowStyle}>
          <Text style={[trendStyle, trendSurface.style as TextStyle | undefined]}>
            {trendIcon} {trend.value}
          </Text>
        </View>
      ) : null}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${label} stat card`}
        accessibilityHint="Tap to view details"
      >
        {inner}
      </TouchableOpacity>
    )
  }
  return inner
}
