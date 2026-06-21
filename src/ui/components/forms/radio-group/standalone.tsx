import React, { useState } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface RadioGroupOption {
  value: string
  label: string
  disabled?: boolean
}

export interface RadioGroupBaseProps {
  /** Options shown in the group. */
  options: RadioGroupOption[]
  /** Controlled selected value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when the selection changes. */
  onChange?: (value: string) => void
  /** Visible group label. */
  label?: string
  /** Layout orientation. */
  orientation?: 'vertical' | 'horizontal'
  /** Slot overrides (container, label, optionsList, option, control, indicator, optionLabel). */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone RadioGroup — plain React props, no manifest required.
 *
 * @example
 * <RadioGroupBase
 *   label="Size"
 *   options={[{value:'sm',label:'Small'},{value:'lg',label:'Large'}]}
 *   value={size}
 *   onChange={setSize}
 * />
 */
export function RadioGroupBase({
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
}: RadioGroupBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState<string | undefined>(defaultValue)
  const isControlled = value !== undefined
  const selected = isControlled ? value : internal

  const activeStates: RuntimeSurfaceState[] | undefined =
    selected != null ? ['selected'] : undefined

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

  const handleSelect = (optionValue: string) => {
    if (!isControlled) setInternal(optionValue)
    onChange?.(optionValue)
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
      <View
        style={optionsListSurface.style as ViewStyle | undefined}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {options.map((option) => {
          const isSelected = selected === option.value
          const disabled = option.disabled ?? false
          const optionStates: RuntimeSurfaceState[] | undefined = [
            ...(isSelected ? (['selected'] as const) : []),
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
          const controlSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              width: 22,
              height: 22,
              borderRadius: 'full',
              border: isSelected ? '2px solid primary' : '2px solid inputBorder',
              bg: 'inputBackground',
              alignItems: 'center',
              justifyContent: 'center',
              states: { disabled: { opacity: 0.5 } },
            },
            componentSurface: slots?.control,
            activeStates: optionStates,
          })
          const indicatorSurface = resolveSurfacePresentation({
            tokens,
            implementationBase: {
              width: 12,
              height: 12,
              borderRadius: 'full',
              bg: 'primary',
            },
            componentSurface: slots?.indicator,
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
              onPress={() => handleSelect(option.value)}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected, disabled }}
              testID={testIDBase ? `${testIDBase}-option-${option.value}` : undefined}
            >
              <View style={controlSurface.style as ViewStyle | undefined}>
                {isSelected ? (
                  <View style={indicatorSurface.style as ViewStyle | undefined} />
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
