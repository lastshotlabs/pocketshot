import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  type KeyboardTypeOptions,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

export interface TextInputBaseProps {
  /** Controlled value. If omitted, the input is uncontrolled. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when text changes. */
  onChangeText?: (text: string) => void
  /** Called when the user submits (Return key). */
  onSubmitEditing?: () => void
  /** Visible label. */
  label?: string
  /** Placeholder when empty. */
  placeholder?: string
  /** Helper text shown beneath input when no error. */
  helperText?: string
  /** Error message — when set, switches the input to invalid state. */
  errorText?: string
  /** Mask input characters (passwords, PINs). */
  secureTextEntry?: boolean
  /** Keyboard type (number-pad, email-address, etc). */
  keyboardType?: KeyboardTypeOptions
  /** Auto-capitalization behavior. */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  /** Auto-complete hint. */
  autoComplete?: string
  /** Render as multi-line textarea. */
  multiline?: boolean
  /** Number of lines when multiline. */
  numberOfLines?: number
  /** Max input length. */
  maxLength?: number
  /** Style applied to root View. */
  style?: ViewStyle
  /** Slot overrides (container, label, input, helperText, errorText). */
  slots?: Record<string, Record<string, unknown>>
  testID?: string
  id?: string
}

/**
 * Standalone TextInput — plain React props, no manifest required.
 *
 * @example
 * <TextInputBase
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 * />
 */
export function TextInputBase({
  value,
  defaultValue,
  onChangeText,
  onSubmitEditing,
  label,
  placeholder,
  helperText,
  errorText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  multiline,
  numberOfLines,
  maxLength,
  style,
  slots,
  testID,
  id,
}: TextInputBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const [focused, setFocused] = useState(false)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const hasError = Boolean(errorText)
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
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'inputBackground',
      border: hasError
        ? '1px solid error'
        : focused
          ? '1px solid borderFocus'
          : '1px solid inputBorder',
      borderRadius: 'md',
      paddingX: 'sm',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
      states: {
        focus: { border: '1px solid borderFocus' },
        invalid: { border: '1px solid error' },
      },
    },
    componentSurface: slots?.input,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'muted',
      marginTop: 'xs',
    },
    componentSurface: slots?.helperText,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: 'error',
      marginTop: 'xs',
    },
    componentSurface: slots?.errorText,
    activeStates,
  })

  const handleChange = (text: string) => {
    if (!isControlled) setInternalValue(text)
    onChangeText?.(text)
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
      <RNTextInput
        style={{
          ...(sharedTextStyle as TextStyle),
          ...(inputSurface.style as TextStyle | undefined),
        }}
        value={currentValue}
        onChangeText={handleChange}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete as never}
        multiline={multiline}
        numberOfLines={multiline ? (numberOfLines ?? 4) : undefined}
        maxLength={maxLength}
        accessibilityLabel={label ?? placeholder ?? id}
        testID={testID ? `${testID}-input` : id ? `${id}-input` : undefined}
      />
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
