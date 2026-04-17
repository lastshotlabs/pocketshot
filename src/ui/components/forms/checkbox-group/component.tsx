import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { CheckboxGroupConfig } from './types'

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

export function CheckboxGroup({ config }: { config: CheckboxGroupConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions = (resolveFromRef(config.options, values) as OptionItem[] | undefined) ?? []
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string[] | undefined) : undefined

  const [selected, setSelected] = useState<string[]>(resolvedValue ?? config.defaultValue ?? [])

  useEffect(() => {
    if (resolvedValue != null) {
      setSelected(resolvedValue)
    }
  }, [resolvedValue])

  const orientation = config.orientation ?? 'vertical'
  const activeStates: RuntimeSurfaceState[] | undefined = selected.length > 0 ? ['selected'] : undefined
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

  const handleToggle = useCallback(
    (optionValue: string) => {
      setSelected((previous) => {
        const next = previous.includes(optionValue)
          ? previous.filter((value) => value !== optionValue)
          : [...previous, optionValue]
        setValue(config.id, next)
        if (config.onChangeAction) {
          void dispatch(config.onChangeAction)
        }
        return next
      })
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
        <View style={optionsListSurface.style as ViewStyle | undefined} accessibilityRole="none">
          {resolvedOptions.map((option) => {
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
              componentSurface: config.slots?.option as Record<string, unknown> | undefined,
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
                states: {
                  disabled: {
                    opacity: 0.5,
                  },
                },
              },
              componentSurface: config.slots?.box as Record<string, unknown> | undefined,
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
              componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
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
                onPress={() => handleToggle(option.value)}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityLabel={option.label}
                accessibilityState={{ checked, disabled }}
                testID={`${testIDBase}-option-${option.value}`}
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
    </ComponentWrapper>
  )
}
