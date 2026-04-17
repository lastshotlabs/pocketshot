import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, Image, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { ProductCardConfig } from './types'

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
  slots: ProductCardConfig['slots']
  sharedTextStyle: TextStyle
}) {
  const tokens = useTokens()

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: STAR_GAP,
    },
    componentSurface: slots?.ratingStarsRow as Record<string, unknown> | undefined,
  })
  const starSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'warning',
    },
    componentSurface: slots?.ratingStar as Record<string, unknown> | undefined,
  })
  const emptyStarSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'border',
    },
    componentSurface: slots?.ratingStar as Record<string, unknown> | undefined,
  })
  const countSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginLeft: 'xs',
    },
    componentSurface: slots?.ratingCount as Record<string, unknown> | undefined,
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
          style={{
            ...sharedTextStyle,
            ...(starSurface.style as TextStyle | undefined),
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          *
        </Text>
      ))}
      {Array.from({ length: empty }).map((_, index) => (
        <Text
          key={`empty-${index}`}
          style={{
            ...sharedTextStyle,
            ...(emptyStarSurface.style as TextStyle | undefined),
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          o
        </Text>
      ))}
      {count != null ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(countSurface.style as TextStyle | undefined),
          }}
        >
          {`(${count})`}
        </Text>
      ) : null}
    </View>
  )
}

export function ProductCard({ config }: { config: ProductCardConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const resolvedTitle = isFromRef(config.title) ? String(resolveFromRef(config.title, values) ?? '') : config.title
  const resolvedDescription =
    config.description != null
      ? isFromRef(config.description)
        ? String(resolveFromRef(config.description, values) ?? '')
        : config.description
      : null
  const resolvedImage =
    config.image != null
      ? isFromRef(config.image)
        ? String(resolveFromRef(config.image, values) ?? '')
        : config.image
      : null
  const resolvedPrice =
    config.price != null
      ? isFromRef(config.price)
        ? Number(resolveFromRef(config.price, values) ?? 0)
        : config.price
      : null
  const resolvedRating =
    config.rating != null
      ? isFromRef(config.rating)
        ? Number(resolveFromRef(config.rating, values) ?? 0)
        : config.rating
      : null
  const resolvedReviewCount =
    config.reviewCount != null
      ? isFromRef(config.reviewCount)
        ? Number(resolveFromRef(config.reviewCount, values) ?? 0)
        : config.reviewCount
      : null

  const currency = config.currency ?? 'USD'
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const pressableStates: RuntimeSurfaceState[] | undefined = config.onPress != null ? ['active'] : undefined

  const pressableSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {},
    componentSurface: config.slots?.pressable as Record<string, unknown> | undefined,
    activeStates: pressableStates,
  })
  const cardSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'card',
      borderRadius: 'lg',
      overflow: 'hidden',
      shadow: 'md',
    },
    componentSurface: config.slots?.card as Record<string, unknown> | undefined,
  })
  const imageSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: '100%',
      height: IMAGE_HEIGHT_APPROX,
    },
    componentSurface: config.slots?.image as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.imagePlaceholder as Record<string, unknown> | undefined,
  })
  const imagePlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.imagePlaceholderText as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.badgeContainer as Record<string, unknown> | undefined,
  })
  const badgeTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'primary-foreground',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    componentSurface: config.slots?.badgeText as Record<string, unknown> | undefined,
  })
  const bodySurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'sm',
    },
    componentSurface: config.slots?.body as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      fontWeight: 'semibold',
      marginBottom: 'xs',
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const descriptionSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginBottom: 'sm',
    },
    componentSurface: config.slots?.description as Record<string, unknown> | undefined,
  })
  const ratingRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      marginBottom: 'sm',
    },
    componentSurface: config.slots?.ratingRow as Record<string, unknown> | undefined,
  })
  const priceRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
    },
    componentSurface: config.slots?.priceRow as Record<string, unknown> | undefined,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'lg',
      color: 'foreground',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.price as Record<string, unknown> | undefined,
  })
  const addButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'primary',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'xs',
    },
    componentSurface: config.slots?.addButton as Record<string, unknown> | undefined,
  })
  const addButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'primary-foreground',
      fontWeight: 'semibold',
    },
    componentSurface: config.slots?.addButtonText as Record<string, unknown> | undefined,
  })

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const handleAddToCart = useCallback(async () => {
    if (!config.onAddToCart) return
    await dispatch(config.onAddToCart)
  }, [config.onAddToCart, dispatch])

  const cardContent = (
    <View style={cardSurface.style as ViewStyle | undefined}>
      {resolvedImage != null ? (
        <Image
          source={{ uri: resolvedImage }}
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
      {config.badge != null ? (
        <View style={badgeContainerSurface.style as ViewStyle | undefined}>
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
      <View style={bodySurface.style as ViewStyle | undefined}>
        <Text
          style={{
            ...sharedTextStyle,
            ...(titleSurface.style as TextStyle | undefined),
          }}
          numberOfLines={2}
        >
          {resolvedTitle}
        </Text>
        {resolvedDescription != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(descriptionSurface.style as TextStyle | undefined),
            }}
            numberOfLines={1}
          >
            {resolvedDescription}
          </Text>
        ) : null}
        {resolvedRating != null ? (
          <View style={ratingRowSurface.style as ViewStyle | undefined}>
            <RatingStars
              rating={resolvedRating}
              count={resolvedReviewCount ?? undefined}
              slots={config.slots}
              sharedTextStyle={sharedTextStyle}
            />
          </View>
        ) : null}
        <View style={priceRowSurface.style as ViewStyle | undefined}>
          {resolvedPrice != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(priceSurface.style as TextStyle | undefined),
              }}
            >
              {formatPrice(resolvedPrice, currency)}
            </Text>
          ) : null}
          {config.onAddToCart != null ? (
            <TouchableOpacity
              style={addButtonSurface.style as ViewStyle | undefined}
              onPress={handleAddToCart}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${resolvedTitle} to cart`}
              testID={config.testID ? `${config.testID}-add-to-cart` : undefined}
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      {config.onPress != null ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={resolvedTitle}
          accessibilityHint="Tap to view product details"
          style={pressableSurface.style as ViewStyle | undefined}
        >
          {cardContent}
        </TouchableOpacity>
      ) : (
        cardContent
      )}
    </ComponentWrapper>
  )
}
