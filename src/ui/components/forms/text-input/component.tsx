import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput as RNTextInput, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { TextInputConfig } from './types'

export function TextInput({ config }: { config: TextInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError = config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

  const [localValue, setLocalValue] = useState<string>(resolvedValue ?? config.defaultValue ?? '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as string)
    }
  }, [resolvedValue])

  const hasError = Boolean(resolvedError)
  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(focused ? (['focus'] as const) : []),
    ...(hasError ? (['invalid'] as const) : []),
  ]
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      gap: 'xs',
    },
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
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'inputBackground',
      border: hasError ? '1px solid error' : focused ? '1px solid borderFocus' : '1px solid inputBorder',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
      states: {
        focus: {
          border: '1px solid borderFocus',
        },
        invalid: {
          border: '1px solid error',
        },
      },
    },
    componentSurface: config.slots?.input as Record<string, unknown> | undefined,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 'xs',
    },
    componentSurface: config.slots?.helperText as Record<string, unknown> | undefined,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'error',
      marginTop: 'xs',
    },
    componentSurface: config.slots?.errorText as Record<string, unknown> | undefined,
    activeStates,
  })

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleSubmit = useCallback(() => {
    if (config.onSubmitAction) {
      void dispatch(config.onSubmitAction)
    }
  }, [config.onSubmitAction, dispatch])

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
        <RNTextInput
          style={{
            ...(sharedTextStyle as TextStyle),
            ...(inputSurface.style as TextStyle | undefined),
          }}
          value={localValue}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={config.placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          secureTextEntry={config.secureTextEntry}
          keyboardType={config.keyboardType}
          autoCapitalize={config.autoCapitalize}
          autoComplete={config.autoComplete as never}
          multiline={config.multiline}
          numberOfLines={config.multiline ? (config.numberOfLines ?? 4) : undefined}
          maxLength={config.maxLength}
          accessibilityLabel={config.label ?? config.placeholder ?? config.id}
          testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
        />
        {hasError && resolvedError ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(errorTextSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {resolvedError as string}
          </Text>
        ) : config.helperText != null ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(helperTextSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
          >
            {config.helperText}
          </Text>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
