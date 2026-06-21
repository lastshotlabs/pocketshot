import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { resolveNativeTextStyle } from '../../_base/text-style'
import { resolveSurfacePresentation } from '../../_base/style-surfaces'
import type { RuntimeSurfaceState } from '../../_base/surface-state'
import { useTokens } from '../../../context/AppContext'

const LINE_HEIGHT = 22

export interface TextareaBaseProps {
  /** Controlled value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called when text changes. */
  onChangeText?: (text: string) => void
  /** Visible label rendered above the input. */
  label?: string
  /** Placeholder text. */
  placeholder?: string
  /** Helper text shown beneath input when no error. */
  helperText?: string
  /** Error message — switches the input to invalid state when set. */
  errorText?: string
  /** Min number of rendered lines. */
  minRows?: number
  /** Max number of rendered lines. */
  maxRows?: number
  /** Max input length. */
  maxLength?: number
  /** Show character count footer (requires maxLength). */
  showCharCount?: boolean
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone Textarea — auto-growing multi-line input.
 *
 * @example
 * <TextareaBase label="Bio" value={bio} onChangeText={setBio} maxLength={280} showCharCount />
 */
export function TextareaBase({
  value,
  defaultValue,
  onChangeText,
  label,
  placeholder,
  helperText,
  errorText,
  minRows = 3,
  maxRows = 8,
  maxLength,
  showCharCount,
  slots,
  style,
  testID,
  id,
}: TextareaBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const [focused, setFocused] = useState(false)
  const [inputHeight, setInputHeight] = useState(minRows * LINE_HEIGHT)

  const isControlled = value !== undefined
  const currentValue = isControlled ? (value ?? '') : internalValue

  const hasError = Boolean(errorText)
  const minHeight = minRows * LINE_HEIGHT
  const maxHeight = maxRows * LINE_HEIGHT
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
  const inputWrapperSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'inputBackground',
      border: hasError
        ? '1px solid error'
        : focused
          ? '1px solid borderFocus'
          : '1px solid inputBorder',
      borderRadius: 'md',
      overflow: 'hidden',
    },
    componentSurface: slots?.inputWrapper,
    activeStates,
  })
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingX: 'sm',
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
      lineHeight: LINE_HEIGHT,
    },
    componentSurface: slots?.input,
    activeStates,
  })
  const footerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'start',
      justifyContent: 'between',
      marginTop: 'xs',
    },
    componentSurface: slots?.footer,
    activeStates,
  })
  const footerLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: slots?.footerLeft,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted' },
    componentSurface: slots?.helperText,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'error' },
    componentSurface: slots?.errorText,
    activeStates,
  })
  const charCountSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: maxLength != null && currentValue.length >= maxLength ? 'error' : 'muted',
      marginLeft: 'xs',
    },
    componentSurface: slots?.charCount,
    activeStates,
  })

  function handleChange(text: string) {
    if (!isControlled) setInternalValue(text)
    onChangeText?.(text)
  }

  function handleContentSizeChange(e: { nativeEvent: { contentSize: { height: number } } }) {
    const newHeight = Math.min(Math.max(e.nativeEvent.contentSize.height, minHeight), maxHeight)
    setInputHeight(newHeight)
  }

  const charCount = currentValue.length
  const showCount = (showCharCount ?? false) && maxLength != null

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
      <View style={inputWrapperSurface.style as ViewStyle | undefined}>
        <RNTextInput
          style={{
            ...(sharedTextStyle as TextStyle),
            height: Math.max(inputHeight, minHeight),
            ...(inputSurface.style as TextStyle | undefined),
          }}
          value={currentValue}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          multiline
          textAlignVertical="top"
          maxLength={maxLength}
          accessibilityLabel={label ?? placeholder ?? id}
          testID={testID ? `${testID}-input` : id ? `${id}-input` : undefined}
          scrollEnabled={inputHeight >= maxHeight}
        />
      </View>
      <View style={footerSurface.style as ViewStyle | undefined}>
        <View style={footerLeftSurface.style as ViewStyle | undefined}>
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
        {showCount ? (
          <Text
            style={{
              ...sharedTextStyle,
              ...(charCountSurface.style as TextStyle | undefined),
            }}
            accessibilityRole="text"
            accessibilityLabel={`${charCount} of ${maxLength} characters`}
          >
            {charCount}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
