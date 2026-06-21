import React, { useState } from 'react'
import { View, Text, Switch as RNSwitch, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface SwitchBaseProps {
  /** Controlled value. If omitted, the switch is uncontrolled. */
  value?: boolean
  /** Initial value when uncontrolled. */
  defaultValue?: boolean
  /** Called when the switch toggles. */
  onValueChange?: (value: boolean) => void
  /** Visible label rendered to the left of the switch. */
  label?: string
  /** Disable interaction and dim the row. */
  disabled?: boolean
  /** Slot overrides (row, label). */
  slots?: Record<string, Record<string, unknown>>
  /** Style applied to the row container. */
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Switch — plain React props, no manifest required.
 *
 * @example
 * <SwitchBase label="Notifications" value={enabled} onValueChange={setEnabled} />
 */
export function SwitchBase({
  value,
  defaultValue,
  onValueChange,
  label,
  disabled,
  slots,
  style,
  testID,
  id,
}: SwitchBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<boolean>(defaultValue ?? false)
  const isControlled = value !== undefined
  const current = isControlled ? !!value : internal

  const activeStates: RuntimeSurfaceState[] = [
    ...(current ? (['selected'] as const) : []),
    ...(disabled ? (['disabled'] as const) : []),
  ]

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingY: 'xs',
    },
    componentSurface: slots?.row,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: 'foreground',
      marginRight: 'sm',
    },
    componentSurface: slots?.label,
    activeStates,
  })

  function handleChange(next: boolean) {
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
  }

  return (
    <View style={[rowSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(labelSurface.style as TextStyle | undefined),
          }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <RNSwitch
        value={current}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{
          false: tokens.colors.border,
          true: tokens.colors.primary,
        }}
        thumbColor={tokens.colors.primaryForeground}
        ios_backgroundColor={tokens.colors.border}
        accessibilityLabel={label ?? id}
        accessibilityRole="switch"
        accessibilityState={{ checked: current, disabled }}
        testID={testID ?? id}
      />
    </View>
  )
}
