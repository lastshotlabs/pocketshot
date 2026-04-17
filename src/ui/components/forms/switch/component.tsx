import React, { useState, useEffect } from 'react'
import { View, Text, Switch as RNSwitch, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { SwitchConfig } from './types'

export function Switch({ config }: { config: SwitchConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined

  const [localValue, setLocalValue] = useState<boolean>(
    (resolvedValue as boolean | undefined) ?? config.defaultValue ?? false,
  )

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as boolean)
    }
  }, [resolvedValue])

  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(localValue ? (['selected'] as const) : []),
    ...(config.disabled ? (['disabled'] as const) : []),
  ]

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'between',
      paddingY: 'xs',
    },
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.label as Record<string, unknown> | undefined,
    activeStates,
  })

  function handleChange(next: boolean) {
    setLocalValue(next)
    setValue(config.id, next)
    if (config.onChangeAction) {
      void dispatch(config.onChangeAction)
    }
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={rowSurface.style as ViewStyle | undefined}>
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
        <RNSwitch
          value={localValue}
          onValueChange={handleChange}
          disabled={config.disabled}
          trackColor={{
            false: tokens.colors.border,
            true: tokens.colors.primary,
          }}
          thumbColor={tokens.colors.primaryForeground}
          ios_backgroundColor={tokens.colors.border}
          accessibilityLabel={config.label ?? config.id}
          accessibilityRole="switch"
          accessibilityState={{ checked: localValue, disabled: config.disabled }}
          testID={config.testID ?? config.id}
        />
      </View>
    </ComponentWrapper>
  )
}
