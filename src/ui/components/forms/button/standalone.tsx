import React, { useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { resolveNativeTextStyle } from '../../_base/text-style'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

// ── Standalone Props ──────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonBaseProps {
  /** Unique identifier (used for surface scoping). */
  id?: string
  /** Button label text. */
  label?: string
  /** Visual variant. */
  variant?: ButtonVariant
  /** Size of the button. */
  size?: ButtonSize
  /** Loading state — replaces label with an animated indicator. */
  loading?: boolean
  /** Disabled state. */
  disabled?: boolean
  /** Spans full width when true. */
  fullWidth?: boolean
  /** Icon glyph (text/emoji) shown before the label. */
  iconLeft?: string
  /** Icon glyph (text/emoji) shown after the label. */
  iconRight?: string
  /** Press handler. */
  onPress?: (event: GestureResponderEvent) => void
  /** Children render inside the button (overrides label/icon layout when provided). */
  children?: React.ReactNode
  /** Accessible label override. */
  accessibilityLabel?: string
  /** Test ID for the root touchable. */
  testID?: string
  /** Style applied to the root touchable. */
  style?: ViewStyle
  /** Slot overrides for sub-elements (button, label, iconLeft, iconRight, loading). */
  slots?: Record<string, Record<string, unknown>>
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const VARIANT_BASE: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
  primary: { bg: 'primary', color: 'primaryForeground' },
  secondary: { bg: 'card', color: 'foreground', border: '1px solid border' },
  ghost: { bg: 'transparent', color: 'primary' },
  outline: { bg: 'transparent', color: 'primary', border: '1px solid primary' },
  destructive: { bg: 'destructive', color: 'destructiveForeground' },
}

const SIZE_BASE: Record<
  ButtonSize,
  { paddingY: 'sm' | 'md' | 'lg'; paddingX: 'sm' | 'md' | 'lg'; fontSize: 'sm' | 'base' | 'lg' }
> = {
  sm: { paddingY: 'sm', paddingX: 'sm', fontSize: 'sm' },
  md: { paddingY: 'md', paddingX: 'md', fontSize: 'base' },
  lg: { paddingY: 'lg', paddingX: 'lg', fontSize: 'lg' },
}

function LoadingIndicator({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Animated.View
          key={index}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            marginHorizontal: 2,
            opacity,
          }}
        />
      ))}
    </View>
  )
}

// ── Standalone component ──────────────────────────────────────────────────────

/**
 * Standalone Button — works with plain React props, no manifest required.
 *
 * @example
 * <ButtonBase label="Save" variant="primary" onPress={() => save()} />
 */
export function ButtonBase({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  onPress,
  children,
  accessibilityLabel,
  testID,
  style,
  slots,
}: ButtonBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const activeStates: RuntimeSurfaceState[] | undefined =
    disabled || loading ? ['disabled'] : undefined

  const variantTokens = useMemo(() => VARIANT_BASE[variant], [variant])

  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'md',
      shadow: variantTokens.bg !== 'transparent' ? 'sm' : undefined,
      alignSelf: fullWidth ? 'stretch' : 'start',
      opacity: disabled || loading ? 0.5 : 1,
      ...SIZE_BASE[size],
      ...variantTokens,
    },
    componentSurface: slots?.button,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      fontWeight: 'semibold',
      color: variantTokens.color,
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const iconLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      color: variantTokens.color,
      marginRight: 'xs',
    },
    componentSurface: slots?.iconLeft,
    activeStates,
  })
  const iconRightSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: SIZE_BASE[size].fontSize,
      color: variantTokens.color,
      marginLeft: 'xs',
    },
    componentSurface: slots?.iconRight,
    activeStates,
  })
  const loadingSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: slots?.loading,
    activeStates,
  })

  const textBase: TextStyle = { ...sharedTextStyle }

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) return
    onPress?.(event)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID ? `${testID}-button` : undefined}
      style={style}
    >
      <View style={buttonSurface.style as ViewStyle | undefined}>
        {loading ? (
          <View style={loadingSurface.style as ViewStyle | undefined}>
            <LoadingIndicator
              color={
                tokens.colors[variantTokens.color as keyof typeof tokens.colors] ??
                tokens.colors.primaryForeground
              }
            />
          </View>
        ) : children ? (
          children
        ) : (
          <>
            {iconLeft ? (
              <Text
                style={{
                  ...textBase,
                  ...(iconLeftSurface.style as TextStyle | undefined),
                }}
                accessibilityElementsHidden
              >
                {iconLeft}
              </Text>
            ) : null}
            {label ? (
              <Text
                style={{
                  ...textBase,
                  ...(labelSurface.style as TextStyle | undefined),
                }}
              >
                {label}
              </Text>
            ) : null}
            {iconRight ? (
              <Text
                style={{
                  ...textBase,
                  ...(iconRightSurface.style as TextStyle | undefined),
                }}
                accessibilityElementsHidden
              >
                {iconRight}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}
