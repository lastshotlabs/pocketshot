import React from 'react'
import { View, Text, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { PriceDisplayConfig } from './types'

type Size = NonNullable<PriceDisplayConfig['size']>

const DISCOUNT_BADGE_PADDING_VERTICAL = 2

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
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(numericAmount)) return String(amount)
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(numericAmount)
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`
  }
}

export function PriceDisplay({ config }: { config: PriceDisplayConfig }) {
  const tokens = useTokens()
  const { values } = useScreenContext()

  const resolvedAmount: number | string = isFromRef(config.amount)
    ? (resolveFromRef(config.amount, values) as unknown as number | string)
    : config.amount

  const resolvedOriginal =
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

  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const textColor = typeof sharedTextStyle.color === 'string' ? sharedTextStyle.color : 'foreground'

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignSelf: 'start',
    },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 'sm',
    },
    componentSurface: config.slots?.priceRow as Record<string, unknown> | undefined,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_FONT[size],
      color: textColor,
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.price as Record<string, unknown> | undefined,
  })
  const originalPriceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: ORIGINAL_SIZE_FONT[size],
      color: 'muted',
      textDecorationLine: 'line-through',
      fontWeight: 'regular',
    },
    componentSurface: config.slots?.originalPrice as Record<string, unknown> | undefined,
  })
  const badgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'error',
      borderRadius: 'sm',
      paddingX: 'sm',
      paddingY: DISCOUNT_BADGE_PADDING_VERTICAL,
    },
    componentSurface: config.slots?.badge as Record<string, unknown> | undefined,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'error-foreground',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    componentSurface: config.slots?.badgeText as Record<string, unknown> | undefined,
  })

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        <View style={priceRowSurface.style as ViewStyle | undefined}>
          {formattedOriginal != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(originalPriceSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {formattedOriginal}
            </Text>
          ) : null}
          <Text
            style={{
              ...sharedTextStyle,
              ...(priceSurface.style as TextStyle | undefined),
            }}
            accessibilityLabel={
              formattedOriginal != null ? `${formattedPrice}, was ${formattedOriginal}` : formattedPrice
            }
          >
            {formattedPrice}
          </Text>
          {config.badge != null ? (
            <View style={badgeSurface.style as ViewStyle | undefined}>
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(badgeTextSurface.style as TextStyle | undefined),
                }}
              >
                {config.badge}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </ComponentWrapper>
  )
}
