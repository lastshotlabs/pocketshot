import React from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'
import type { ColorTokens, TypographyTokens } from '../../../tokens/types'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeBaseProps {
  label?: string
  children?: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  onPress?: (event: GestureResponderEvent) => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
}

function resolveVariantColors(
  variant: BadgeVariant,
  colors: ColorTokens,
): { background: string; foreground: string } {
  switch (variant) {
    case 'primary':
      return { background: colors.primary, foreground: colors.primaryForeground }
    case 'success':
      return { background: colors.success, foreground: colors.successForeground }
    case 'warning':
      return { background: colors.warning, foreground: colors.warningForeground }
    case 'error':
      return { background: colors.error, foreground: colors.errorForeground }
    case 'info':
      return { background: colors.info, foreground: colors.infoForeground }
    case 'default':
    default:
      return { background: colors.badgeBackground, foreground: colors.badgeForeground }
  }
}

const SIZE_PADDING: Record<BadgeSize, { paddingHorizontal: number; paddingVertical: number }> = {
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  lg: { paddingHorizontal: 14, paddingVertical: 6 },
}

const SIZE_FONT_TOKEN: Record<BadgeSize, keyof TypographyTokens> = {
  sm: 'fontSizeXs',
  md: 'fontSizeSm',
  lg: 'fontSizeMd',
}

/**
 * Standalone Badge — plain React props, no manifest required.
 *
 * @example
 * <BadgeBase label="New" variant="primary" />
 */
export function BadgeBase({
  label,
  children,
  variant = 'default',
  size = 'md',
  onPress,
  style,
  slots,
  testID,
}: BadgeBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const variantColors = resolveVariantColors(variant, tokens.colors)
  const sizeStyle = SIZE_PADDING[size]
  const fontSize = tokens.typography[SIZE_FONT_TOKEN[size]] as number

  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      backgroundColor: variantColors.background,
      borderRadius: 'full',
      paddingX: sizeStyle.paddingHorizontal,
      paddingY: sizeStyle.paddingVertical,
    },
    componentSurface: slots?.root,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: slots?.label,
  })

  const containerStyle: ViewStyle = { alignSelf: 'flex-start', ...style }
  const labelStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize: fontSize,
    color: variantColors.foreground,
    fontWeight: tokens.typography.fontWeightSemibold,
    letterSpacing: 0.2,
  }

  const display = children ?? label ?? ''

  const badge = (
    <View style={[containerStyle, rootSurface.style as ViewStyle | undefined]} testID={testID}>
      <Text style={[labelStyle, labelSurface.style as TextStyle | undefined]} numberOfLines={1}>
        {display}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={typeof display === 'string' ? display : undefined}
      >
        {badge}
      </TouchableOpacity>
    )
  }
  return badge
}
