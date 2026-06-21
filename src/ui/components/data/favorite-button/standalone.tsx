import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import { useTokens } from '../../../context/AppContext'

export type FavoriteButtonVariant = 'heart' | 'star'
export type FavoriteButtonSize = 'sm' | 'md' | 'lg'

export interface FavoriteButtonBaseProps {
  /** Controlled active state. Omit for uncontrolled. */
  value?: boolean
  /** Initial active state when uncontrolled. */
  defaultValue?: boolean
  /** Glyph variant. */
  variant?: FavoriteButtonVariant
  /** Visual size. */
  size?: FavoriteButtonSize
  /** Override active color. */
  activeColor?: string
  /** Called when the user toggles. Receives the new value. */
  onPress?: (next: boolean) => void
  /** Slot overrides (root, icon). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

const FONT_SIZE: Record<FavoriteButtonSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

/**
 * Standalone FavoriteButton — plain React props, no manifest required.
 *
 * @example
 * <FavoriteButtonBase variant="heart" defaultValue={false} onPress={(v) => save(v)} />
 */
export function FavoriteButtonBase({
  value,
  defaultValue,
  variant = 'heart',
  size = 'md',
  activeColor,
  onPress,
  slots,
  style,
  testID,
  id,
}: FavoriteButtonBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)

  const isControlled = value !== undefined
  const [internalActive, setInternalActive] = useState<boolean>(defaultValue ?? false)
  const active = isControlled ? Boolean(value) : internalActive

  useEffect(() => {
    if (isControlled) return
  }, [isControlled])

  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  const rootSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.root })
  const iconSurface = resolveSurfacePresentation({ tokens, componentSurface: slots?.icon })

  const handlePress = useCallback(() => {
    const nextActive = !active

    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start()

    if (!nextActive) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1.0, duration: 120, useNativeDriver: true }),
      ]).start()
    }

    if (!isControlled) setInternalActive(nextActive)
    onPress?.(nextActive)
  }, [active, isControlled, onPress, opacity, scale])

  const resolvedActiveColor =
    activeColor ?? (variant === 'heart' ? tokens.colors.error : tokens.colors.warning)
  const inactiveColor = tokens.colors.textMuted
  const icon = variant === 'heart' ? (active ? '♥' : '♡') : active ? '★' : '☆'
  const fontSize = FONT_SIZE[size]

  const iconStyle: TextStyle = {
    ...sharedTextStyle,
    fontSize,
    color: active ? resolvedActiveColor : inactiveColor,
    lineHeight: fontSize * 1.2,
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      style={[rootSurface.style as ViewStyle | undefined, style]}
      hitSlop={HIT_SLOP}
      accessibilityRole="togglebutton"
      accessibilityLabel={`${variant} button${active ? ', active' : ''}`}
      accessibilityState={{ checked: active }}
      testID={testID ?? (id ? `${id}-favorite-button` : 'favorite-button')}
    >
      <Animated.Text
        style={[
          iconStyle,
          { transform: [{ scale }], opacity },
          iconSurface.style as TextStyle | undefined,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {icon}
      </Animated.Text>
    </TouchableOpacity>
  )
}
