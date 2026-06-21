import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Animated,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface PasswordInputBaseProps {
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when text changes. */
  onChangeText?: (text: string) => void
  /** Called on Return key. */
  onSubmitEditing?: () => void
  /** Visible label. */
  label?: string
  /** Placeholder when empty. */
  placeholder?: string
  /** Helper text shown when no error. */
  helperText?: string
  /** Error message — switches input to invalid. */
  errorText?: string
  /** Show visibility toggle button. */
  showToggle?: boolean
  /** Auto-complete hint. */
  autoComplete?: string
  /** Max input length. */
  maxLength?: number
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone PasswordInput — masked text input with show/hide toggle.
 *
 * @example
 * <PasswordInputBase label="Password" value={pw} onChangeText={setPw} />
 */
export function PasswordInputBase({
  value,
  defaultValue,
  onChangeText,
  onSubmitEditing,
  label,
  placeholder,
  helperText,
  errorText,
  showToggle = true,
  autoComplete,
  maxLength,
  slots,
  style,
  testID,
  id,
}: PasswordInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState(defaultValue ?? '')
  const [focused, setFocused] = useState(false)
  const [secureEntry, setSecureEntry] = useState(true)
  const opacityAnim = useRef(new Animated.Value(1)).current

  const isControlled = value !== undefined
  const currentValue = isControlled ? (value ?? '') : internal
  const hasError = Boolean(errorText)
  const testIDBase = testID ?? id
  const activeStates: RuntimeSurfaceState[] = [
    ...(focused ? (['focus'] as const) : []),
    ...(hasError ? (['invalid'] as const) : []),
  ]

  const containerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { gap: 'xs' },
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
  const inputRowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: hasError
        ? '1px solid error'
        : focused
          ? '1px solid borderFocus'
          : '1px solid inputBorder',
      borderRadius: 'md',
      states: {
        focus: { border: '1px solid borderFocus' },
        invalid: { border: '1px solid error' },
      },
    },
    componentSurface: slots?.inputRow,
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
    componentSurface: slots?.input,
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
    componentSurface: slots?.toggleButton,
    activeStates,
  })
  const toggleTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', fontWeight: 'medium', color: 'muted' },
    componentSurface: slots?.toggleText,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted', marginTop: 'xs' },
    componentSurface: slots?.helperText,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'error', marginTop: 'xs' },
    componentSurface: slots?.errorText,
    activeStates,
  })

  function handleChange(text: string) {
    if (!isControlled) setInternal(text)
    onChangeText?.(text)
  }

  function toggleSecureEntry() {
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start()
    setSecureEntry((prev) => !prev)
  }

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
      <View style={inputRowSurface.style as ViewStyle | undefined}>
        <RNTextInput
          style={{ ...sharedTextStyle, ...(inputSurface.style as TextStyle | undefined) }}
          value={currentValue}
          onChangeText={handleChange}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          secureTextEntry={secureEntry}
          autoCapitalize="none"
          autoComplete={(autoComplete as never) ?? ('password' as never)}
          maxLength={maxLength}
          accessibilityLabel={label ?? placeholder ?? id}
          testID={testIDBase ? `${testIDBase}-input` : undefined}
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
              testID={testIDBase ? `${testIDBase}-toggle` : undefined}
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
      {hasError && errorText ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(errorTextSurface.style as TextStyle | undefined),
          }}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : helperText != null ? (
        <Text
          style={{
            ...sharedTextStyle,
            ...(helperTextSurface.style as TextStyle | undefined),
          }}
          accessibilityRole="text"
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  )
}
