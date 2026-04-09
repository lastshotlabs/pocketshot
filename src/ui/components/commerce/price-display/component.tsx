import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { PriceDisplayConfig } from './types'

type Size = NonNullable<PriceDisplayConfig['size']>

const SIZE_FONT: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
}

const ORIGINAL_SIZE_FONT: Record<Size, number> = {
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
}

function formatPrice(amount: number | string, currency: string, locale: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return String(amount)
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num)
  } catch {
    return `${currency} ${num.toFixed(2)}`
  }
}

export function PriceDisplay({ config }: { config: PriceDisplayConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedAmount: number | string = isFromRef(config.amount)
    ? (resolveFromRef(config.amount, values) as unknown as number | string)
    : config.amount

  const resolvedOriginal: number | null =
    config.originalAmount != null
      ? isFromRef(config.originalAmount)
        ? (resolveFromRef(config.originalAmount, values) as unknown as number)
        : config.originalAmount
      : null

  const currency = config.currency ?? 'USD'
  const locale = config.locale ?? 'en-US'
  const size = config.size ?? 'md'

  const formattedPrice = formatPrice(resolvedAmount, currency, locale)
  const formattedOriginal =
    resolvedOriginal != null ? formatPrice(resolvedOriginal, currency, locale) : null

  const textColor = config.color ?? tokens.colors.text
  const styles = makeStyles(tokens, size, textColor)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        <View style={styles.priceRow}>
          {formattedOriginal != null ? (
            <Text
              style={styles.originalPrice}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {formattedOriginal}
            </Text>
          ) : null}
          <Text
            style={styles.price}
            accessibilityLabel={
              formattedOriginal != null
                ? `${formattedPrice}, was ${formattedOriginal}`
                : formattedPrice
            }
          >
            {formattedPrice}
          </Text>
          {config.badge != null ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{config.badge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, size: Size, textColor: string) {
  const fontSize = SIZE_FONT[size]
  const originalFontSize = ORIGINAL_SIZE_FONT[size]

  return StyleSheet.create({
    container: {
      alignSelf: 'flex-start',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: tokens.spacing[2],
    },
    price: {
      fontSize,
      color: textColor,
      fontWeight: tokens.typography.fontWeightBold,
    },
    originalPrice: {
      fontSize: originalFontSize,
      color: tokens.colors.textMuted,
      textDecorationLine: 'line-through',
      fontWeight: tokens.typography.fontWeightRegular,
    },
    badge: {
      backgroundColor: tokens.colors.error,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.errorForeground,
      fontWeight: tokens.typography.fontWeightBold,
      letterSpacing: 0.5,
    },
  })
}
