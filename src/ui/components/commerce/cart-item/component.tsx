import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { CartItemConfig } from './types'

const THUMBNAIL_SIZE = 56

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function CartItem({ config }: { config: CartItemConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedTitle = isFromRef(config.title)
    ? String(resolveFromRef(config.title, values) ?? '')
    : config.title

  const resolvedVariant =
    config.variant != null
      ? isFromRef(config.variant)
        ? String(resolveFromRef(config.variant, values) ?? '')
        : config.variant
      : null

  const resolvedImage =
    config.image != null
      ? isFromRef(config.image)
        ? String(resolveFromRef(config.image, values) ?? '')
        : config.image
      : null

  const resolvedPrice = isFromRef(config.price)
    ? Number(resolveFromRef(config.price, values) ?? 0)
    : config.price

  const resolvedQuantity = isFromRef(config.quantity)
    ? Number(resolveFromRef(config.quantity, values) ?? 1)
    : (config.quantity ?? 1)

  const currency = config.currency ?? 'USD'
  const total = resolvedPrice * resolvedQuantity

  const handleDecrement = useCallback(async () => {
    if (!config.onQuantityChange) return
    const newQty = Math.max(1, resolvedQuantity - 1)
    setValue('__cartItemId', config.id ?? '')
    setValue('__newQuantity', newQty)
    await dispatch(config.onQuantityChange)
  }, [config.onQuantityChange, config.id, resolvedQuantity, setValue, dispatch])

  const handleIncrement = useCallback(async () => {
    if (!config.onQuantityChange) return
    const newQty = resolvedQuantity + 1
    setValue('__cartItemId', config.id ?? '')
    setValue('__newQuantity', newQty)
    await dispatch(config.onQuantityChange)
  }, [config.onQuantityChange, config.id, resolvedQuantity, setValue, dispatch])

  const handleRemove = useCallback(async () => {
    if (!config.onRemove) return
    await dispatch(config.onRemove)
  }, [config.onRemove, dispatch])

  const styles = makeStyles(tokens)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.row}>
        {/* Thumbnail */}
        {resolvedImage != null ? (
          <Image
            source={{ uri: resolvedImage }}
            style={styles.thumbnail}
            resizeMode="cover"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text
              style={styles.thumbnailPlaceholderText}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              🛍
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {resolvedTitle}
          </Text>
          {resolvedVariant != null ? (
            <Text style={styles.variant} numberOfLines={1}>
              {resolvedVariant}
            </Text>
          ) : null}
          <Text style={styles.price}>{formatPrice(resolvedPrice, currency)}</Text>
        </View>

        {/* Right column: quantity + remove */}
        <View style={styles.rightColumn}>
          {config.onRemove != null ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${resolvedTitle} from cart`}
              testID={config.testID ? `${config.testID}-remove` : undefined}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrement}
              activeOpacity={0.7}
              disabled={!config.onQuantityChange}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              testID={config.testID ? `${config.testID}-decrement` : undefined}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue} accessibilityLabel={`Quantity: ${resolvedQuantity}`}>
              {resolvedQuantity}
            </Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleIncrement}
              activeOpacity={0.7}
              disabled={!config.onQuantityChange}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              testID={config.testID ? `${config.testID}-increment` : undefined}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.total} accessibilityLabel={`Total: ${formatPrice(total, currency)}`}>
            {formatPrice(total, currency)}
          </Text>
        </View>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  const BUTTON_SIZE = 28

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[2],
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.radius.md,
      ...tokens.shadows.sm,
    },
    thumbnail: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      borderRadius: tokens.radius.sm,
      resizeMode: 'cover',
    },
    thumbnailPlaceholder: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      borderRadius: tokens.radius.sm,
      backgroundColor: tokens.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbnailPlaceholderText: {
      fontSize: 24,
    },
    content: {
      flex: 1,
      marginHorizontal: tokens.spacing[3],
    },
    title: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
      marginBottom: 2,
    },
    variant: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[1],
    },
    price: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    rightColumn: {
      alignItems: 'flex-end',
      gap: tokens.spacing[2],
    },
    removeButton: {
      padding: 4,
    },
    removeButtonText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: tokens.radius.md,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      overflow: 'hidden',
    },
    quantityButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.colors.surfaceAlt,
    },
    quantityButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightMedium,
      lineHeight: tokens.typography.fontSizeMd * 1.2,
    },
    quantityValue: {
      minWidth: 28,
      textAlign: 'center',
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    total: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightBold,
    },
  })
}
