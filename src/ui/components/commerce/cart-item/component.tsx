import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, Image, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { CartItemConfig } from './types'

const THUMBNAIL_SIZE = 56
const TITLE_MARGIN_BOTTOM = 2
const BUTTON_SIZE = 28

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

  const resolvedTitle = isFromRef(config.title) ? String(resolveFromRef(config.title, values) ?? '') : config.title
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
  const resolvedPrice = isFromRef(config.price) ? Number(resolveFromRef(config.price, values) ?? 0) : config.price
  const resolvedQuantity = isFromRef(config.quantity)
    ? Number(resolveFromRef(config.quantity, values) ?? 1)
    : (config.quantity ?? 1)

  const total = resolvedPrice * resolvedQuantity
  const currency = config.currency ?? 'USD'
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)
  const actionEnabled = config.onQuantityChange != null

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingY: 'sm',
      paddingX: 'xs',
      bg: 'card',
      borderRadius: 'md',
      shadow: 'sm',
    },
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
  })
  const thumbnailSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      borderRadius: 'sm',
    },
    componentSurface: config.slots?.thumbnail as Record<string, unknown> | undefined,
  })
  const thumbnailPlaceholderSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      borderRadius: 'sm',
      bg: 'muted',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.thumbnailPlaceholder as Record<string, unknown> | undefined,
  })
  const thumbnailPlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'muted',
      fontWeight: 'medium',
    },
    componentSurface: config.slots?.thumbnailPlaceholderText as Record<string, unknown> | undefined,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      marginX: 'sm',
    },
    componentSurface: config.slots?.content as Record<string, unknown> | undefined,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'foreground',
      fontWeight: 'semibold',
      marginBottom: TITLE_MARGIN_BOTTOM,
    },
    componentSurface: config.slots?.title as Record<string, unknown> | undefined,
  })
  const variantSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginBottom: 'xs',
    },
    componentSurface: config.slots?.variant as Record<string, unknown> | undefined,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.price as Record<string, unknown> | undefined,
  })
  const rightColumnSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'end',
      gap: 'sm',
    },
    componentSurface: config.slots?.rightColumn as Record<string, unknown> | undefined,
  })
  const removeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      padding: 'xs',
    },
    componentSurface: config.slots?.removeButton as Record<string, unknown> | undefined,
  })
  const removeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
    },
    componentSurface: config.slots?.removeButtonText as Record<string, unknown> | undefined,
  })
  const quantityControlsSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 'md',
      border: '1px solid border',
      overflow: 'hidden',
    },
    componentSurface: config.slots?.quantityControls as Record<string, unknown> | undefined,
  })
  const quantityButtonStates: RuntimeSurfaceState[] | undefined = actionEnabled ? undefined : ['disabled']
  const quantityButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      bg: 'muted',
      opacity: actionEnabled ? 1 : 0.5,
      states: {
        disabled: {
          opacity: 0.5,
        },
      },
    },
    componentSurface: config.slots?.quantityButton as Record<string, unknown> | undefined,
    activeStates: quantityButtonStates,
  })
  const quantityButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      fontWeight: 'medium',
      lineHeight: 19,
    },
    componentSurface: config.slots?.quantityButtonText as Record<string, unknown> | undefined,
    activeStates: quantityButtonStates,
  })
  const quantityValueSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      minWidth: 28,
      textAlign: 'center',
      fontSize: 'sm',
      color: 'foreground',
      fontWeight: 'semibold',
    },
    componentSurface: config.slots?.quantityValue as Record<string, unknown> | undefined,
  })
  const totalSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'foreground',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.total as Record<string, unknown> | undefined,
  })

  const handleDecrement = useCallback(async () => {
    if (!config.onQuantityChange) return
    const newQuantity = Math.max(1, resolvedQuantity - 1)
    setValue('__cartItemId', config.id ?? '')
    setValue('__newQuantity', newQuantity)
    await dispatch(config.onQuantityChange)
  }, [config.id, config.onQuantityChange, dispatch, resolvedQuantity, setValue])

  const handleIncrement = useCallback(async () => {
    if (!config.onQuantityChange) return
    const newQuantity = resolvedQuantity + 1
    setValue('__cartItemId', config.id ?? '')
    setValue('__newQuantity', newQuantity)
    await dispatch(config.onQuantityChange)
  }, [config.id, config.onQuantityChange, dispatch, resolvedQuantity, setValue])

  const handleRemove = useCallback(async () => {
    if (!config.onRemove) return
    await dispatch(config.onRemove)
  }, [config.onRemove, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={rowSurface.style as ViewStyle | undefined}>
        {resolvedImage != null ? (
          <Image
            source={{ uri: resolvedImage }}
            style={thumbnailSurface.style as ImageStyle | undefined}
            resizeMode="cover"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <View style={thumbnailPlaceholderSurface.style as ViewStyle | undefined}>
            <Text
              style={{
                ...sharedTextStyle,
                ...(thumbnailPlaceholderTextSurface.style as TextStyle | undefined),
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              Cart
            </Text>
          </View>
        )}

        <View style={contentSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...sharedTextStyle,
              ...(titleSurface.style as TextStyle | undefined),
            }}
            numberOfLines={2}
          >
            {resolvedTitle}
          </Text>
          {resolvedVariant != null ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(variantSurface.style as TextStyle | undefined),
              }}
              numberOfLines={1}
            >
              {resolvedVariant}
            </Text>
          ) : null}
          <Text
            style={{
              ...sharedTextStyle,
              ...(priceSurface.style as TextStyle | undefined),
            }}
          >
            {formatPrice(resolvedPrice, currency)}
          </Text>
        </View>

        <View style={rightColumnSurface.style as ViewStyle | undefined}>
          {config.onRemove != null ? (
            <TouchableOpacity
              style={removeButtonSurface.style as ViewStyle | undefined}
              onPress={handleRemove}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${resolvedTitle} from cart`}
              testID={config.testID ? `${config.testID}-remove` : undefined}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(removeButtonTextSurface.style as TextStyle | undefined),
                }}
              >
                X
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={quantityControlsSurface.style as ViewStyle | undefined}>
            <TouchableOpacity
              style={quantityButtonSurface.style as ViewStyle | undefined}
              onPress={handleDecrement}
              activeOpacity={0.7}
              disabled={!config.onQuantityChange}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              testID={config.testID ? `${config.testID}-decrement` : undefined}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(quantityButtonTextSurface.style as TextStyle | undefined),
                }}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                ...sharedTextStyle,
                ...(quantityValueSurface.style as TextStyle | undefined),
              }}
              accessibilityLabel={`Quantity: ${resolvedQuantity}`}
            >
              {String(resolvedQuantity)}
            </Text>
            <TouchableOpacity
              style={quantityButtonSurface.style as ViewStyle | undefined}
              onPress={handleIncrement}
              activeOpacity={0.7}
              disabled={!config.onQuantityChange}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              testID={config.testID ? `${config.testID}-increment` : undefined}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(quantityButtonTextSurface.style as TextStyle | undefined),
                }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              ...sharedTextStyle,
              ...(totalSurface.style as TextStyle | undefined),
            }}
            accessibilityLabel={`Total: ${formatPrice(total, currency)}`}
          >
            {formatPrice(total, currency)}
          </Text>
        </View>
      </View>
    </ComponentWrapper>
  )
}
