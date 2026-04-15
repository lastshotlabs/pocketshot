import React, { useCallback } from 'react'
import { Text, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { ColorTokens, TypographyTokens } from '../../../tokens/types'
import type { BadgeConfig } from './types'

type Variant = NonNullable<BadgeConfig['variant']>
type Size = NonNullable<BadgeConfig['size']>

function resolveVariantColors(
  variant: Variant,
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

const SIZE_PADDING: Record<Size, { paddingHorizontal: number; paddingVertical: number }> = {
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  lg: { paddingHorizontal: 14, paddingVertical: 6 },
}

const SIZE_FONT_TOKEN: Record<Size, keyof TypographyTokens> = {
  sm: 'fontSizeXs',
  md: 'fontSizeSm',
  lg: 'fontSizeMd',
}

export function Badge({ config }: { config: BadgeConfig }) {
  const tokens = useTokens()
  const { dispatch, values } = useScreenContext()

  const resolvedLabel = isFromRef(config.label)
    ? String(resolveFromRef(config.label, values) ?? '')
    : config.label

  const variantColors = resolveVariantColors(config.variant ?? 'default', tokens.colors)
  const sizeStyle = SIZE_PADDING[config.size ?? 'md']
  const fontSize = tokens.typography[SIZE_FONT_TOKEN[config.size ?? 'md']] as number
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const rootSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      backgroundColor: variantColors.background,
      borderRadius: 'full',
      paddingX: sizeStyle.paddingHorizontal,
      paddingY: sizeStyle.paddingVertical,
    },
    componentSurface: config.slots?.root as Record<string, unknown> | undefined,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
  })

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
  }
  const labelStyle: TextStyle = {
    fontSize: typeof sharedTextStyle.fontSize === 'number' ? sharedTextStyle.fontSize : fontSize,
    color:
      typeof sharedTextStyle.color === 'string'
        ? sharedTextStyle.color
        : variantColors.foreground,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string'
        ? sharedTextStyle.fontWeight
        : tokens.typography.fontWeightSemibold,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number'
        ? sharedTextStyle.letterSpacing
        : 0.2,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  const badge = (
    <View style={[containerStyle, rootSurface.style as ViewStyle | undefined]}>
      <Text style={[labelStyle, labelSurface.style as TextStyle | undefined]} numberOfLines={1}>
        {resolvedLabel}
      </Text>
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={resolvedLabel}
        >
          {badge}
        </TouchableOpacity>
      ) : (
        badge
      )}
    </ComponentWrapper>
  )
}
