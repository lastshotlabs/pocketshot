import React from 'react'
import { Text, View, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type PriceDisplaySize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_FONT: Record<PriceDisplaySize, number> = { sm: 14, md: 18, lg: 24, xl: 32 }
const ORIGINAL_SIZE_FONT: Record<PriceDisplaySize, number> = { sm: 12, md: 14, lg: 18, xl: 24 }
const DISCOUNT_BADGE_PADDING_VERTICAL = 2

function formatPrice(amount: number | string, currency: string, locale: string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(numericAmount)) return String(amount)
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(numericAmount)
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`
  }
}

export interface PriceDisplayBaseProps {
  amount: number | string
  originalAmount?: number
  currency?: string
  locale?: string
  size?: PriceDisplaySize
  badge?: string
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone PriceDisplay — plain React props, no manifest required.
 *
 * @example
 * <PriceDisplayBase amount={29.99} originalAmount={49.99} badge="40% OFF" size="lg" />
 */
export function PriceDisplayBase({
  amount,
  originalAmount,
  currency = 'USD',
  locale = 'en-US',
  size = 'md',
  badge,
  style,
  slots,
  testID,
  id,
}: PriceDisplayBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const formattedPrice = formatPrice(amount, currency, locale)
  const formattedOriginal = originalAmount != null ? formatPrice(originalAmount, currency, locale) : null

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { alignSelf: 'start' },
    componentSurface: slots?.container,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 'sm' },
    componentSurface: slots?.priceRow,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: SIZE_FONT[size], color: 'foreground', fontWeight: 'bold' },
    componentSurface: slots?.price,
  })
  const originalPriceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: ORIGINAL_SIZE_FONT[size],
      color: 'muted',
      textDecorationLine: 'line-through',
      fontWeight: 'regular',
    },
    componentSurface: slots?.originalPrice,
  })
  const badgeSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'error',
      borderRadius: 'sm',
      paddingX: 'sm',
      paddingY: DISCOUNT_BADGE_PADDING_VERTICAL,
    },
    componentSurface: slots?.badge,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'error-foreground',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    componentSurface: slots?.badgeText,
  })

  return (
    <View
      style={[containerSurface.style as ViewStyle | undefined, style]}
      testID={testID ?? id}
    >
      <View style={priceRowSurface.style as ViewStyle | undefined}>
        {formattedOriginal != null ? (
          <Text
            style={{ ...sharedTextStyle, ...(originalPriceSurface.style as TextStyle | undefined) }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {formattedOriginal}
          </Text>
        ) : null}
        <Text
          style={{ ...sharedTextStyle, ...(priceSurface.style as TextStyle | undefined) }}
          accessibilityLabel={
            formattedOriginal != null ? `${formattedPrice}, was ${formattedOriginal}` : formattedPrice
          }
        >
          {formattedPrice}
        </Text>
        {badge != null ? (
          <View style={badgeSurface.style as ViewStyle | undefined}>
            <Text style={{ ...sharedTextStyle, ...(badgeTextSurface.style as TextStyle | undefined) }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
