import React, { useState } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface CheckboxGroupOption {
  value: string
  label: string
  disabled?: boolean
}

export interface CheckboxGroupBaseProps {
  /** Options shown in the group. */
  options: CheckboxGroupOption[]
  /** Controlled selected values. */
  value?: string[]
  /** Initial selected values when uncontrolled. */
  defaultValue?: string[]
  /** Called when the selection changes. */
  onChange?: (value: string[]) => void
  /** Visible group label. */
  label?: string
  /** Layout orientation. */
  orientation?: 'vertical' | 'horizontal'
  /** Slot overrides (container, label, optionsList, option, box, checkmark, optionLabel). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone CheckboxGroup — plain React props, no manifest required.
 *
 * @example
 * <CheckboxGroupBase
 *   label="Toppings"
 *   options={[{value:'a',label:'A'},{value:'b',label:'B'}]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 */
export function CheckboxGroupBase({
  options,
  value,
  defaultValue,
  onChange,
  label,
  orientation = 'vertical',
  slots,
  style,
  testID,
  id,
}: CheckboxGroupBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<string[]>(defaultValue ?? [])
  const isControlled = value !== undefined
  const selected = isControlled ? (value ?? []) : internal

  const activeStates: RuntimeSurfaceState[] | undefined =
    selected.length > 0 ? ['selected'] : undefined

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: slots?.container,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'foreground',
      marginBottom: 'xs',
    },
    componentSurface: slots?.label,
    activeStates,
  })
  const optionsListSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      gap: orientation === 'horizontal' ? 'lg' : 'md',
    },
    componentSurface: slots?.optionsList,
    activeStates,
  })

  const handleToggle = (optionValue: string) => {
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue]
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const testIDBase = testID ?? id

  return (
    <View style={[containerSurface.style as ViewStyle | undefined, style]}>
      {label != null ? (
        <Text
          style={{ ...sharedTextStyle, ...(labelSurface.style as TextStyle | undefined) }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}
      <View style={optionsListSurface.style as ViewStyle | undefined} accessibilityRole="none">
        {options.map((option) => {
          const checked = selected.includes(option.value)
          const disabled = option.disabled ?? false
          const optionStates: RuntimeSurfaceState[] | undefined = [
            ...(checked ? (['selected'] as const) : []),
            ...(disabled ? (['disabled'] as const) : []),
          ]
          const optionSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 'md',
              opacity: disabled ? 0.5 : 1,
            },
            componentSurface: slots?.option,
            activeStates: optionStates,
          })
          const boxSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              width: 22,
              height: 22,
              borderRadius: 'sm',
              border: checked ? '2px solid primary' : '2px solid inputBorder',
              bg: checked ? 'primary' : 'inputBackground',
              alignItems: 'center',
              justifyContent: 'center',
              states: { disabled: { opacity: 0.5 } },
            },
            componentSurface: slots?.box,
            activeStates: optionStates,
          })
          const checkmarkSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              fontSize: 'xs',
              color: 'primary-foreground',
              fontWeight: 'bold',
              lineHeight: 16,
            },
            componentSurface: slots?.checkmark,
            activeStates: optionStates,
          })
          const optionLabelSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              fontSize: 'base',
              color: 'foreground',
            },
            componentSurface: slots?.optionLabel,
            activeStates: optionStates,
          })

          return (
            <TouchableOpacity
              key={option.value}
              style={optionSurface.style as ViewStyle | undefined}
              onPress={() => handleToggle(option.value)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityLabel={option.label}
              accessibilityState={{ checked, disabled }}
              testID={testIDBase ? `${testIDBase}-option-${option.value}` : undefined}
            >
              <View style={boxSurface.style as ViewStyle | undefined}>
                {checked ? (
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
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(optionLabelSurface.style as TextStyle | undefined),
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
