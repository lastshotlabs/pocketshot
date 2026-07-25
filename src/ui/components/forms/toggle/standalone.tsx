import React, { useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export type ToggleVariant = 'default' | 'primary' | 'outline'
export type ToggleSize = 'sm' | 'md' | 'lg'

export interface ToggleBaseProps {
  /** Controlled active state. */
  value?: boolean
  /** Initial value when uncontrolled. */
  defaultValue?: boolean
  /** Called when active state changes. */
  onValueChange?: (value: boolean) => void
  /** Visible label. */
  label?: string
  /** Icon glyph (text/emoji). */
  icon?: string
  /** Visual variant for the active state. */
  variant?: ToggleVariant
  /** Size. */
  size?: ToggleSize
  /** Disable interaction and dim the button. */
  disabled?: boolean
  /** Slot overrides (button, icon, label). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

function sizeSurface(size: ToggleSize) {
  switch (size) {
    case 'sm':
      return { paddingY: 'xs', paddingX: 'sm', fontSize: 'sm' }
    case 'lg':
      return { paddingY: 'md', paddingX: 'lg', fontSize: 'lg' }
    case 'md':
    default:
      return { paddingY: 'sm', paddingX: 'md', fontSize: 'base' }
  }
}

/**
 * Standalone Toggle — pressable toggle button with active/inactive states.
 *
 * @example
 * <ToggleBase label="Bold" value={bold} onValueChange={setBold} />
 */
export function ToggleBase({
  value,
  defaultValue,
  onValueChange,
  label,
  icon,
  variant = 'default',
  size = 'md',
  disabled = false,
  slots,
  style,
  testID,
  id,
}: ToggleBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<boolean>(defaultValue ?? false)
  const isControlled = value !== undefined
  const active = isControlled ? !!value : internal
  const scaleAnim = useRef(new Animated.Value(1)).current

  const activeStates: RuntimeSurfaceState[] | undefined = disabled
    ? ['disabled']
    : active
      ? ['selected']
      : undefined

  const variantTokens = active
    ? variant === 'primary'
      ? { bg: 'primary', color: 'primary-foreground', border: '0px solid transparent' }
      : variant === 'outline'
        ? { bg: 'transparent', color: 'primary', border: '1px solid primary' }
        : { bg: 'card', color: 'foreground', border: '2px solid primary' }
    : { bg: 'popover', color: 'muted', border: '1px solid border' }

  const buttonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'xs',
      borderRadius: 'md',
      opacity: disabled ? 0.4 : 1,
      ...sizeSurface(size),
      ...variantTokens,
    },
    componentSurface: slots?.button,
    activeStates,
  })
  const iconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: sizeSurface(size).fontSize,
      color:
        active && variant === 'primary'
          ? 'primary-foreground'
          : active && variant === 'outline'
            ? 'primary'
            : active
              ? 'foreground'
              : 'muted',
    },
    componentSurface: slots?.icon,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: sizeSurface(size).fontSize,
      fontWeight: 'medium',
      color:
        active && variant === 'primary'
          ? 'primary-foreground'
          : active && variant === 'outline'
            ? 'primary'
            : active
              ? 'foreground'
              : 'muted',
    },
    componentSurface: slots?.label,
    activeStates,
  })

  const baseTextStyle: TextStyle = {
    fontSize: typeof sharedTextStyle.fontSize === 'number' ? sharedTextStyle.fontSize : undefined,
    fontWeight:
      typeof sharedTextStyle.fontWeight === 'string' ? sharedTextStyle.fontWeight : undefined,
    lineHeight:
      typeof sharedTextStyle.lineHeight === 'number' ? sharedTextStyle.lineHeight : undefined,
    letterSpacing:
      typeof sharedTextStyle.letterSpacing === 'number' ? sharedTextStyle.letterSpacing : undefined,
    textAlign:
      typeof sharedTextStyle.textAlign === 'string' ? sharedTextStyle.textAlign : undefined,
    opacity: typeof sharedTextStyle.opacity === 'number' ? sharedTextStyle.opacity : undefined,
  }

  function handlePress() {
    if (disabled) return
    const next = !active
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
  }

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start()
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start()
  }

  const accessibilityLabel = label ?? icon ?? (active ? 'Active toggle' : 'Inactive toggle')

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], alignSelf: 'flex-start' }, style]}>
      <TouchableOpacity
        style={buttonSurface.style as ViewStyle | undefined}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="togglebutton"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: active, disabled }}
        accessibilityHint={active ? 'Tap to deactivate' : 'Tap to activate'}
        testID={testID ?? id}
      >
        {icon != null ? (
          <Text style={{ ...baseTextStyle, ...(iconSurface.style as TextStyle | undefined) }}>
            {icon}
          </Text>
        ) : null}
        {label != null ? (
          <Text style={{ ...baseTextStyle, ...(labelSurface.style as TextStyle | undefined) }}>
            {label}
          </Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  )
}
