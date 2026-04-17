import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { RadioGroupConfig } from './types'

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

export function RadioGroup({ config }: { config: RadioGroupConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions = (resolveFromRef(config.options, values) as OptionItem[] | undefined) ?? []
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined

  const [selected, setSelected] = useState<string | undefined>(resolvedValue ?? config.defaultValue)

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const orientation = config.orientation ?? 'vertical'
  const activeStates: RuntimeSurfaceState[] | undefined = selected != null ? ['selected'] : undefined
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'sm' },
    componentSurface: config.slots?.container as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })
  const optionsListSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: orientation === 'horizontal' ? 'wrap' : 'nowrap',
      gap: orientation === 'horizontal' ? 'lg' : 'md',
    },
    componentSurface: config.slots?.optionsList as Record<string, unknown> | undefined,
    activeStates,
  })

  const handleSelect = useCallback(
    (optionValue: string) => {
      setSelected(optionValue)
      setValue(config.id, optionValue)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={containerSurface.style as ViewStyle | undefined}>
        {config.label != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(labelSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
          >
            {config.label}
          </Text>
        ) : null}
        <View
          style={optionsListSurface.style as ViewStyle | undefined}
          accessibilityRole="radiogroup"
          accessibilityLabel={config.label}
        >
          {resolvedOptions.map((option) => {
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
              componentSurface: config.slots?.option as Record<string, unknown> | undefined,
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
                states: {
                  disabled: {
                    opacity: 0.5,
                  },
                },
              },
              componentSurface: config.slots?.control as Record<string, unknown> | undefined,
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
              componentSurface: config.slots?.indicator as Record<string, unknown> | undefined,
              activeStates: optionStates,
            })
            const optionLabelSurface = resolveSurfacePresentation({
              tokens,
              implementationBase: {
                fontSize: 'base',
                color: 'foreground',
              },
              componentSurface: config.slots?.optionLabel as Record<string, unknown> | undefined,
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
                testID={`${testIDBase}-option-${option.value}`}
              >
                <View style={controlSurface.style as ViewStyle | undefined}>
                  {isSelected ? <View style={indicatorSurface.style as ViewStyle | undefined} /> : null}
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
    </ComponentWrapper>
  )
}
