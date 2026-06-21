import React, { useState } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface CheckboxBaseProps {
  /** Controlled checked state. If omitted, the checkbox is uncontrolled. */
  checked?: boolean
  /** Initial checked state when uncontrolled. */
  defaultChecked?: boolean
  /** Called when checked state toggles. */
  onCheckedChange?: (checked: boolean) => void
  /** Visible label next to the box. */
  label?: string
  /** Disable interaction and dim the row. */
  disabled?: boolean
  /** Slot overrides (row, box, checkmark, label). */
  slots?: Record<string, Record<string, unknown>>
  /** Style applied to the row container. */
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Checkbox — plain React props, no manifest required.
 *
 * @example
 * <CheckboxBase label="Accept" checked={agree} onCheckedChange={setAgree} />
 */
export function CheckboxBase({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  disabled,
  slots,
  style,
  testID,
  id,
}: CheckboxBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<boolean>(defaultChecked ?? false)
  const isControlled = checked !== undefined
  const isChecked = isControlled ? !!checked : internal

  const activeStates: RuntimeSurfaceState[] = [
    ...(isChecked ? (['selected'] as const) : []),
    ...(disabled ? (['disabled'] as const) : []),
  ]

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'sm',
      opacity: disabled ? 0.5 : 1,
    },
    componentSurface: slots?.row,
    activeStates,
  })
  const boxSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 22,
      height: 22,
      borderRadius: 'sm',
      border: isChecked ? '2px solid primary' : '2px solid inputBorder',
      bg: isChecked ? 'primary' : 'inputBackground',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: slots?.box,
    activeStates,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'primaryForeground',
      fontWeight: 'bold',
    },
    componentSurface: slots?.checkmark,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: slots?.label,
    activeStates,
  })

  function handlePress() {
    if (disabled) return
    const next = !isChecked
    if (!isControlled) setInternal(next)
    onCheckedChange?.(next)
  }

  return (
    <TouchableOpacity
      style={[rowSurface.style as ViewStyle | undefined, style]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: isChecked, disabled }}
      testID={testID ?? id}
    >
      <View style={boxSurface.style as ViewStyle | undefined}>
        {isChecked ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(checkmarkSurface.style as TextStyle | undefined),
            }}
          >
            X
          </Text>
        ) : null}
      </View>
      {label != null ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(labelSurface.style as TextStyle | undefined),
          }}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}
