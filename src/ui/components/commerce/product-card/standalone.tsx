import React from 'react'
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const IMAGE_HEIGHT_APPROX = 180
const STAR_GAP = 2
const BADGE_PADDING_VERTICAL = 3

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function RatingStars({
  rating,
  count,
  slots,
  sharedTextStyle,
}: {
  rating: number
  count?: number
  slots?: Record<string, Record<string, unknown>>
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()
  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', gap: STAR_GAP },
    componentSurface: slots?.ratingStarsRow,
  })
  const starSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'warning' },
    componentSurface: slots?.ratingStar,
  })
  const emptyStarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'border' },
    componentSurface: slots?.ratingStar,
  })
  const countSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted', marginLeft: 'xs' },
    componentSurface: slots?.ratingCount,
  })
  const full = Math.floor(rating)
  const empty = Math.max(0, 5 - full)
  return (
    <View
      style={rowSurface.style as ViewStyle | undefined}
      accessibilityLabel={`Rated ${rating} out of 5${count != null ? `, ${count} reviews` : ''}`}
    >
      {Array.from({ length: full }).map((_, index) => (
        <Text
          key={`full-${index}`}
          style={{ ...sharedTextStyle, ...(starSurface.style as TextStyle | undefined) }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          *
        </Text>
      ))}
      {Array.from({ length: empty }).map((_, index) => (
        <Text
          key={`empty-${index}`}
          style={{ ...sharedTextStyle, ...(emptyStarSurface.style as TextStyle | undefined) }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          o
        </Text>
      ))}
      {count != null ? (
        <Text style={{ ...sharedTextStyle, ...(countSurface.style as TextStyle | undefined) }}>
          {`(${count})`}
        </Text>
      ) : null}
    </View>
  )
}

export interface ProductCardBaseProps {
  title: string
  description?: string
  image?: string
  price?: number
  rating?: number
  reviewCount?: number
  badge?: string
  currency?: string
  onPress?: () => void
  onAddToCart?: () => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone ProductCard — plain React props, no manifest required.
 *
 * @example
 * <ProductCardBase title="Cool Hat" price={29.99} onAddToCart={() => addToCart()} />
 */
export function ProductCardBase({
  title,
  description,
  image,
  price,
  rating,
  reviewCount,
  badge,
  currency = 'USD',
  onPress,
  onAddToCart,
  style,
  slots,
  testID,
  id,
}: ProductCardBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const pressableStates: RuntimeSurfaceState[] | undefined = onPress != null ? ['active'] : undefined

  const pressableSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {},
    componentSurface: slots?.pressable,
    activeStates: pressableStates,
  })
  const cardSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'card', borderRadius: 'lg', overflow: 'hidden', shadow: 'md' },
    componentSurface: slots?.card,
  })
  const imageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: '100%', height: IMAGE_HEIGHT_APPROX },
    componentSurface: slots?.image,
  })
  const imagePlaceholderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      height: IMAGE_HEIGHT_APPROX,
      bg: 'muted',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: slots?.imagePlaceholder,
  })
  const imagePlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.imagePlaceholderText,
  })
  const badgeContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      position: 'absolute',
      top: 'sm',
      left: 'sm',
      bg: 'primary',
      borderRadius: 'sm',
      paddingX: 'sm',
      paddingY: BADGE_PADDING_VERTICAL,
    },
    componentSurface: slots?.badgeContainer,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'primary-foreground',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    componentSurface: slots?.badgeText,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'sm' },
    componentSurface: slots?.body,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      fontWeight: 'semibold',
      marginBottom: 'xs',
    },
    componentSurface: slots?.title,
  })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginBottom: 'sm' },
    componentSurface: slots?.description,
  })
  const ratingRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { marginBottom: 'sm' },
    componentSurface: slots?.ratingRow,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'between' },
    componentSurface: slots?.priceRow,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'lg', color: 'foreground', fontWeight: 'bold' },
    componentSurface: slots?.price,
  })
  const addButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { bg: 'primary', borderRadius: 'md', paddingX: 'sm', paddingY: 'xs' },
    componentSurface: slots?.addButton,
  })
  const addButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'primary-foreground', fontWeight: 'semibold' },
    componentSurface: slots?.addButtonText,
  })

  const cardContent = (
    <View style={cardSurface.style as ViewStyle | undefined}>
      {image != null ? (
        <Image
          source={{ uri: image }}
          style={imageSurface.style as ImageStyle | undefined}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={imagePlaceholderSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...sharedTextStyle,
              ...(imagePlaceholderTextSurface.style as TextStyle | undefined),
            }}
          >
            No Image
          </Text>
        </View>
      )}
      {badge != null ? (
        <View style={badgeContainerSurface.style as ViewStyle | undefined}>
          <Text style={{ ...sharedTextStyle, ...(badgeTextSurface.style as TextStyle | undefined) }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <View style={bodySurface.style as ViewStyle | undefined}>
        <Text
          style={{ ...sharedTextStyle, ...(titleSurface.style as TextStyle | undefined) }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description != null ? (
          <Text
            style={{ ...sharedTextStyle, ...(descriptionSurface.style as TextStyle | undefined) }}
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}
        {rating != null ? (
          <View style={ratingRowSurface.style as ViewStyle | undefined}>
            <RatingStars
              rating={rating}
              count={reviewCount}
              slots={slots}
              sharedTextStyle={sharedTextStyle}
            />
          </View>
        ) : null}
        <View style={priceRowSurface.style as ViewStyle | undefined}>
          {price != null ? (
            <Text style={{ ...sharedTextStyle, ...(priceSurface.style as TextStyle | undefined) }}>
              {formatPrice(price, currency)}
            </Text>
          ) : null}
          {onAddToCart != null ? (
            <TouchableOpacity
              style={addButtonSurface.style as ViewStyle | undefined}
              onPress={onAddToCart}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${title} to cart`}
              testID={testID ? `${testID}-add-to-cart` : undefined}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(addButtonTextSurface.style as TextStyle | undefined),
                }}
              >
                Add
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  )

  return (
    <View style={style} testID={testID ?? id}>
      {onPress != null ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint="Tap to view product details"
          style={pressableSurface.style as ViewStyle | undefined}
        >
          {cardContent}
        </TouchableOpacity>
      ) : (
        cardContent
      )}
    </View>
  )
}
