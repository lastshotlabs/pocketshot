import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { CheckboxConfig } from './types'

export function Checkbox({ config }: { config: CheckboxConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedChecked =
    config.checked != null ? resolveFromRef(config.checked, values) : undefined

  const [localChecked, setLocalChecked] = useState<boolean>(
    (resolvedChecked as boolean | undefined) ?? config.defaultChecked ?? false,
  )

  useEffect(() => {
    if (resolvedChecked != null) {
      setLocalChecked(resolvedChecked as boolean)
    }
  }, [resolvedChecked])

  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(localChecked ? (['selected'] as const) : []),
    ...(config.disabled ? (['disabled'] as const) : []),
  ]

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'sm',
      opacity: config.disabled ? 0.5 : 1,
    },
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
    activeStates,
  })
  const boxSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      width: 22,
      height: 22,
      borderRadius: 'sm',
      border: localChecked ? '2px solid primary' : '2px solid inputBorder',
      bg: localChecked ? 'primary' : 'inputBackground',
      alignItems: 'center',
      justifyContent: 'center',
    },
    componentSurface: config.slots?.box as Record<string, unknown> | undefined,
    activeStates,
  })
  const checkmarkSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'primaryForeground',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.checkmark as Record<string, unknown> | undefined,
    activeStates,
  })
  const labelSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      fontSize: 'base',
      color: 'foreground',
    },
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })

  function handlePress() {
    if (config.disabled) return
    const next = !localChecked
    setLocalChecked(next)
    setValue(config.id, next)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <TouchableOpacity
        style={rowSurface.style as ViewStyle | undefined}
        onPress={handlePress}
        activeOpacity={config.disabled ? 1 : 0.7}
        accessibilityRole="checkbox"
        accessibilityLabel={config.label}
        accessibilityState={{ checked: localChecked, disabled: config.disabled }}
        testID={config.testID ?? config.id}
      >
        <View style={boxSurface.style as ViewStyle | undefined}>
          {localChecked ? (
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
            ...(labelSurface.style as TextStyle | undefined),
          }}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    </ComponentWrapper>
  )
}
