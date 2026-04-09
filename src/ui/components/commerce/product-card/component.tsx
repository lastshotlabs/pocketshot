import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { ProductCardConfig } from './types'

const IMAGE_ASPECT_RATIO = 4 / 3
const IMAGE_HEIGHT_APPROX = 180

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function RatingStars({ rating, count, tokens }: { rating: number; count?: number; tokens: DesignTokens }) {
  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    star: { fontSize: 13, color: '#F59E0B' },
    emptyStar: { fontSize: 13, color: tokens.colors.border },
    count: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted, marginLeft: 4 },
  })

  const full = Math.floor(rating)
  const empty = 5 - full

  return (
    <View style={styles.row} accessibilityLabel={`Rated ${rating} out of 5${count != null ? `, ${count} reviews` : ''}`}>
      {Array.from({ length: full }).map((_, i) => (
        <Text key={`full-${i}`} style={styles.star} accessibilityElementsHidden importantForAccessibility="no">★</Text>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <Text key={`empty-${i}`} style={styles.emptyStar} accessibilityElementsHidden importantForAccessibility="no">★</Text>
      ))}
      {count != null ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  )
}

export function ProductCard({ config }: { config: ProductCardConfig }) {
  const tokens = useTokens()
  const { values, dispatch } = useScreenContext()

  const resolvedTitle = isFromRef(config.title)
    ? String(resolveFromRef(config.title, values) ?? '')
    : config.title

  const resolvedDescription = config.description != null
    ? isFromRef(config.description)
      ? String(resolveFromRef(config.description, values) ?? '')
      : config.description
    : null

  const resolvedImage = config.image != null
    ? isFromRef(config.image)
      ? String(resolveFromRef(config.image, values) ?? '')
      : config.image
    : null

  const resolvedPrice = config.price != null
    ? isFromRef(config.price)
      ? Number(resolveFromRef(config.price, values) ?? 0)
      : config.price
    : null

  const resolvedRating = config.rating != null
    ? isFromRef(config.rating)
      ? Number(resolveFromRef(config.rating, values) ?? 0)
      : config.rating
    : null

  const resolvedReviewCount = config.reviewCount != null
    ? isFromRef(config.reviewCount)
      ? Number(resolveFromRef(config.reviewCount, values) ?? 0)
      : config.reviewCount
    : null

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const handleAddToCart = useCallback(async () => {
    if (!config.onAddToCart) return
    await dispatch(config.onAddToCart)
  }, [config.onAddToCart, dispatch])

  const styles = makeStyles(tokens)

  const cardContent = (
    <View style={styles.card}>
      {resolvedImage != null ? (
        <Image
          source={{ uri: resolvedImage }}
          style={styles.image}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Image</Text>
        </View>
      )}
      {config.badge != null ? (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{config.badge}</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {resolvedTitle}
        </Text>
        {resolvedDescription != null ? (
          <Text style={styles.description} numberOfLines={1}>
            {resolvedDescription}
          </Text>
        ) : null}
        {resolvedRating != null ? (
          <View style={styles.ratingRow}>
            <RatingStars rating={resolvedRating} count={resolvedReviewCount ?? undefined} tokens={tokens} />
          </View>
        ) : null}
        <View style={styles.priceRow}>
          {resolvedPrice != null ? (
            <Text style={styles.price}>{formatPrice(resolvedPrice, config.currency)}</Text>
          ) : null}
          {config.onAddToCart != null ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add ${resolvedTitle} to cart`}
              testID={config.testID ? `${config.testID}-add-to-cart` : undefined}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      {config.onPress != null ? (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={resolvedTitle}
          accessibilityHint="Tap to view product details"
        >
          {cardContent}
        </TouchableOpacity>
      ) : (
        cardContent
      )}
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.lg,
      overflow: 'hidden',
      ...tokens.shadows.md,
    },
    image: {
      width: '100%',
      height: IMAGE_HEIGHT_APPROX,
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      width: '100%',
      height: IMAGE_HEIGHT_APPROX,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imagePlaceholderText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    badgeContainer: {
      position: 'absolute',
      top: tokens.spacing[2],
      left: tokens.spacing[2],
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.sm,
      paddingHorizontal: tokens.spacing[2],
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
      letterSpacing: 0.5,
    },
    body: {
      padding: tokens.spacing[3],
    },
    title: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
      marginBottom: tokens.spacing[1],
    },
    description: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[2],
    },
    ratingRow: {
      marginBottom: tokens.spacing[2],
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    price: {
      fontSize: tokens.typography.fontSizeLg,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
    },
    addButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
    },
    addButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
  })
}
