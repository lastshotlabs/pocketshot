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

export interface CartItemBaseProps {
  title: string
  variant?: string
  image?: string
  price: number
  quantity?: number
  currency?: string
  onQuantityChange?: (newQuantity: number) => void
  onRemove?: () => void
  style?: ViewStyle
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone CartItem — plain React props, no manifest required.
 *
 * @example
 * <CartItemBase
 *   title="Hat"
 *   price={19.99}
 *   quantity={2}
 *   onQuantityChange={(q) => updateQuantity(q)}
 *   onRemove={() => remove()}
 * />
 */
export function CartItemBase({
  title,
  variant,
  image,
  price,
  quantity = 1,
  currency = 'USD',
  onQuantityChange,
  onRemove,
  style,
  slots,
  testID,
  id,
}: CartItemBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const total = price * quantity
  const actionEnabled = onQuantityChange != null

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
    componentSurface: slots?.row,
  })
  const thumbnailSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, borderRadius: 'sm' },
    componentSurface: slots?.thumbnail,
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
    componentSurface: slots?.thumbnailPlaceholder,
  })
  const thumbnailPlaceholderTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'muted', fontWeight: 'medium' },
    componentSurface: slots?.thumbnailPlaceholderText,
  })
  const contentSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, marginX: 'sm' },
    componentSurface: slots?.content,
  })
  const titleSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'foreground',
      fontWeight: 'semibold',
      marginBottom: TITLE_MARGIN_BOTTOM,
    },
    componentSurface: slots?.title,
  })
  const variantSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted', marginBottom: 'xs' },
    componentSurface: slots?.variant,
  })
  const priceSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.price,
  })
  const rightColumnSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { alignItems: 'end', gap: 'sm' },
    componentSurface: slots?.rightColumn,
  })
  const removeButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { padding: 'xs' },
    componentSurface: slots?.removeButton,
  })
  const removeButtonTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted' },
    componentSurface: slots?.removeButtonText,
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
    componentSurface: slots?.quantityControls,
  })
  const quantityButtonStates: RuntimeSurfaceState[] | undefined = actionEnabled
    ? undefined
    : ['disabled']
  const quantityButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      bg: 'muted',
      opacity: actionEnabled ? 1 : 0.5,
      states: { disabled: { opacity: 0.5 } },
    },
    componentSurface: slots?.quantityButton,
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
    componentSurface: slots?.quantityButtonText,
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
    componentSurface: slots?.quantityValue,
  })
  const totalSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'foreground', fontWeight: 'bold' },
    componentSurface: slots?.total,
  })

  const handleDecrement = () => onQuantityChange?.(Math.max(1, quantity - 1))
  const handleIncrement = () => onQuantityChange?.(quantity + 1)

  return (
    <View
      style={[rowSurface.style as ViewStyle | undefined, style]}
      testID={testID ?? id}
    >
      {image != null ? (
        <Image
          source={{ uri: image }}
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
          style={{ ...sharedTextStyle, ...(titleSurface.style as TextStyle | undefined) }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {variant != null ? (
          <Text
            style={{ ...sharedTextStyle, ...(variantSurface.style as TextStyle | undefined) }}
            numberOfLines={1}
          >
            {variant}
          </Text>
        ) : null}
        <Text style={{ ...sharedTextStyle, ...(priceSurface.style as TextStyle | undefined) }}>
          {formatPrice(price, currency)}
        </Text>
      </View>
      <View style={rightColumnSurface.style as ViewStyle | undefined}>
        {onRemove != null ? (
          <TouchableOpacity
            style={removeButtonSurface.style as ViewStyle | undefined}
            onPress={onRemove}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${title} from cart`}
            testID={testID ? `${testID}-remove` : undefined}
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
            disabled={!actionEnabled}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
            testID={testID ? `${testID}-decrement` : undefined}
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
            style={{ ...sharedTextStyle, ...(quantityValueSurface.style as TextStyle | undefined) }}
            accessibilityLabel={`Quantity: ${quantity}`}
          >
            {String(quantity)}
          </Text>
          <TouchableOpacity
            style={quantityButtonSurface.style as ViewStyle | undefined}
            onPress={handleIncrement}
            activeOpacity={0.7}
            disabled={!actionEnabled}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
            testID={testID ? `${testID}-increment` : undefined}
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
          style={{ ...sharedTextStyle, ...(totalSurface.style as TextStyle | undefined) }}
          accessibilityLabel={`Total: ${formatPrice(total, currency)}`}
        >
          {formatPrice(total, currency)}
        </Text>
      </View>
    </View>
  )
}
