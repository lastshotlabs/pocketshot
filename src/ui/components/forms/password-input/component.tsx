import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Animated,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { PasswordInputConfig } from './types'

export function PasswordInput({ config }: { config: PasswordInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError = config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

  const [localValue, setLocalValue] = useState<string>(
    (resolvedValue as string | undefined) ?? config.defaultValue ?? '',
  )
  const [focused, setFocused] = useState(false)
  const [secureEntry, setSecureEntry] = useState(true)
  const opacityAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as string)
    }
  }, [resolvedValue])

  const hasError = Boolean(resolvedError)
  const showToggle = config.showToggle ?? true
  const testIDBase = config.testID ?? config.id
  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(focused ? (['focus'] as const) : []),
    ...(hasError ? (['invalid'] as const) : []),
  ]
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'xs' },
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
  const inputRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: hasError ? '1px solid error' : focused ? '1px solid borderFocus' : '1px solid inputBorder',
      borderRadius: 'md',
      states: {
        focus: {
          border: '1px solid borderFocus',
        },
        invalid: {
          border: '1px solid error',
        },
      },
    },
    componentSurface: config.slots?.inputRow as Record<string, unknown> | undefined,
    activeStates,
  })
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      paddingX: 'sm',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
    },
    componentSurface: config.slots?.input as Record<string, unknown> | undefined,
    activeStates,
  })
  const toggleButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'sm',
      paddingY: 'xs',
      justifyContent: 'center',
      alignItems: 'center',
    },
    componentSurface: config.slots?.toggleButton as Record<string, unknown> | undefined,
    activeStates,
  })
  const toggleTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      fontWeight: 'medium',
      color: 'muted',
    },
    componentSurface: config.slots?.toggleText as Record<string, unknown> | undefined,
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

  const toggleSecureEntry = useCallback(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.4,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start()
    setSecureEntry((prev) => !prev)
  }, [opacityAnim])

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
        <View style={inputRowSurface.style as ViewStyle | undefined}>
          <RNTextInput
            style={{
              ...sharedTextStyle,
              ...(inputSurface.style as TextStyle | undefined),
            }}
            value={localValue}
            onChangeText={handleChange}
            onSubmitEditing={handleSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={config.placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            secureTextEntry={secureEntry}
            autoCapitalize="none"
            autoComplete={(config.autoComplete as never) ?? ('password' as never)}
            maxLength={config.maxLength}
            accessibilityLabel={config.label ?? config.placeholder ?? config.id}
            testID={`${testIDBase}-input`}
          />
          {showToggle ? (
            <Animated.View style={{ opacity: opacityAnim }}>
              <TouchableOpacity
                style={toggleButtonSurface.style as ViewStyle | undefined}
                onPress={toggleSecureEntry}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={secureEntry ? 'Show password' : 'Hide password'}
                accessibilityHint="Toggles password visibility"
                testID={`${testIDBase}-toggle`}
              >
                <Text
                  style={{
                    ...sharedTextStyle,
                    ...(toggleTextSurface.style as TextStyle | undefined),
                  }}
                >
                  {secureEntry ? 'Show' : 'Hide'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </View>
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
