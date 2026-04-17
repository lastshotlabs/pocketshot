import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput as RNTextInput, Animated, type TextStyle, type ViewStyle } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { resolveNativeTextStyle, resolveSurfacePresentation } from '../../_base'
import type { RuntimeSurfaceState } from '../../_base'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { TextareaConfig } from './types'

const LINE_HEIGHT = 22

export function Textarea({ config }: { config: TextareaConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError = config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

  const [localValue, setLocalValue] = useState<string>(
    (resolvedValue as string | undefined) ?? config.defaultValue ?? '',
  )
  const [focused, setFocused] = useState(false)
  const [inputHeight, setInputHeight] = useState((config.minRows ?? 3) * LINE_HEIGHT)
  const focusAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (resolvedValue != null) {
      setLocalValue(resolvedValue as string)
    }
  }, [resolvedValue])

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start()
  }, [focusAnim, focused])

  const hasError = Boolean(resolvedError)
  const minHeight = (config.minRows ?? 3) * LINE_HEIGHT
  const maxHeight = (config.maxRows ?? 8) * LINE_HEIGHT
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
  const inputWrapperSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      bg: 'inputBackground',
      border: hasError ? '1px solid error' : focused ? '1px solid borderFocus' : '1px solid inputBorder',
      borderRadius: 'md',
      overflow: 'hidden',
    },
    componentSurface: config.slots?.inputWrapper as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.input as Record<string, unknown> | undefined,
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
    componentSurface: config.slots?.footer as Record<string, unknown> | undefined,
    activeStates,
  })
  const footerLeftSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1 },
    componentSurface: config.slots?.footerLeft as Record<string, unknown> | undefined,
    activeStates,
  })
  const helperTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'muted' },
    componentSurface: config.slots?.helperText as Record<string, unknown> | undefined,
    activeStates,
  })
  const errorTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'xs', color: 'error' },
    componentSurface: config.slots?.errorText as Record<string, unknown> | undefined,
    activeStates,
  })
  const charCountSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'xs',
      color: config.maxLength != null && localValue.length >= config.maxLength ? 'error' : 'muted',
      marginLeft: 'xs',
    },
    componentSurface: config.slots?.charCount as Record<string, unknown> | undefined,
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

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(Math.max(e.nativeEvent.contentSize.height, minHeight), maxHeight)
      setInputHeight(newHeight)
    },
    [maxHeight, minHeight],
  )

  const charCount = localValue.length
  const showCount = (config.showCharCount ?? false) && config.maxLength != null

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
        <Animated.View style={inputWrapperSurface.style as ViewStyle | undefined}>
          <RNTextInput
            style={{
              ...(sharedTextStyle as TextStyle),
              height: Math.max(inputHeight, minHeight),
              ...(inputSurface.style as TextStyle | undefined),
            }}
            value={localValue}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onContentSizeChange={handleContentSizeChange}
            placeholder={config.placeholder}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            multiline
            textAlignVertical="top"
            maxLength={config.maxLength}
            accessibilityLabel={config.label ?? config.placeholder ?? config.id}
            testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
            scrollEnabled={inputHeight >= maxHeight}
          />
        </Animated.View>
        <View style={footerSurface.style as ViewStyle | undefined}>
          <View style={footerLeftSurface.style as ViewStyle | undefined}>
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
          {showCount ? (
            <Text
              style={{
                ...sharedTextStyle,
                ...(charCountSurface.style as TextStyle | undefined),
              }}
              accessibilityRole="text"
              accessibilityLabel={`${charCount} of ${config.maxLength} characters`}
            >
              {charCount}/{config.maxLength}
            </Text>
          ) : null}
        </View>
      </View>
    </ComponentWrapper>
  )
}
