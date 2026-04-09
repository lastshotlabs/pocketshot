import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { ColorTokens, DesignTokens, TypographyTokens } from '../../../tokens/types'
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

  const styles = makeStyles(tokens, variantColors, sizeStyle, fontSize)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const badge = (
    <View style={styles.container}>
      <Text style={styles.label} numberOfLines={1}>
        {resolvedLabel}
      </Text>
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
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

function makeStyles(
  tokens: DesignTokens,
  variantColors: { background: string; foreground: string },
  sizeStyle: { paddingHorizontal: number; paddingVertical: number },
  fontSize: number,
) {
  return StyleSheet.create({
    container: {
      alignSelf: 'flex-start',
      backgroundColor: variantColors.background,
      borderRadius: tokens.radius.full,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      paddingVertical: sizeStyle.paddingVertical,
    },
    label: {
      fontSize,
      color: variantColors.foreground,
      fontWeight: tokens.typography.fontWeightSemibold,
      letterSpacing: 0.2,
    },
  })
}
