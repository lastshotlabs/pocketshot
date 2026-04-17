import React, { useState, useCallback, useRef, useEffect } from 'react'
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
import type { SearchBarConfig } from './types'

export function SearchBar({ config }: { config: SearchBarConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [localValue, setLocalValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<RNTextInput>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelSlide = useRef(new Animated.Value(0)).current

  const showCancel = config.showCancelButton ?? false
  const activeStates: RuntimeSurfaceState[] | undefined = [
    ...(focused ? (['focus'] as const) : []),
  ]
  const sharedTextStyle = resolveNativeTextStyle(config as Record<string, unknown>, tokens)

  useEffect(() => {
    if (!showCancel) return
    Animated.timing(cancelSlide, {
      toValue: focused || localValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [cancelSlide, focused, localValue, showCancel])

  useEffect(() => {
    if (config.autoFocus) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [config.autoFocus])

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 'xs',
    },
    componentSurface: config.slots?.row as Record<string, unknown> | undefined,
    activeStates,
  })
  const inputContainerSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      bg: 'inputBackground',
      border: focused ? '1px solid borderFocus' : '1px solid inputBorder',
      borderRadius: 'md',
      paddingX: 'sm',
    },
    componentSurface: config.slots?.inputContainer as Record<string, unknown> | undefined,
    activeStates,
  })
  const searchIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      marginRight: 'xs',
    },
    componentSurface: config.slots?.searchIcon as Record<string, unknown> | undefined,
    activeStates,
  })
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      flex: 1,
      paddingY: 'sm',
      fontSize: 'base',
      color: 'inputText',
    },
    componentSurface: config.slots?.input as Record<string, unknown> | undefined,
    activeStates,
  })
  const clearButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingLeft: 'xs',
      paddingY: 'xs',
      justifyContent: 'center',
      alignItems: 'center',
    },
    componentSurface: config.slots?.clearButton as Record<string, unknown> | undefined,
    activeStates,
  })
  const clearIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'sm',
      color: 'muted',
      fontWeight: 'bold',
    },
    componentSurface: config.slots?.clearIcon as Record<string, unknown> | undefined,
    activeStates,
  })
  const cancelButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      paddingY: 'xs',
      paddingX: 'xs',
    },
    componentSurface: config.slots?.cancelButton as Record<string, unknown> | undefined,
    activeStates,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: {
      fontSize: 'base',
      color: 'primary',
      fontWeight: 'medium',
    },
    componentSurface: config.slots?.cancelText as Record<string, unknown> | undefined,
    activeStates,
  })

  const publishValue = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        publishValue(text)
      }, config.debounceMs ?? 300)
    },
    [config.debounceMs, publishValue],
  )

  const handleClear = useCallback(() => {
    setLocalValue('')
    publishValue('')
    inputRef.current?.focus()
  }, [publishValue])

  const handleCancel = useCallback(() => {
    setLocalValue('')
    publishValue('')
    inputRef.current?.blur()
  }, [publishValue])

  const handleSubmit = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    setValue(config.id, localValue)
    if (config.onSubmitAction) {
      void dispatch(config.onSubmitAction)
    }
  }, [config.id, config.onSubmitAction, dispatch, localValue, setValue])

  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <View style={rowSurface.style as ViewStyle | undefined}>
        <View style={inputContainerSurface.style as ViewStyle | undefined}>
          <Text
            style={{
              ...sharedTextStyle,
              ...(searchIconSurface.style as TextStyle | undefined),
            }}
            accessibilityElementsHidden
          >
            Search
          </Text>
          <RNTextInput
            ref={inputRef}
            style={{
              ...(sharedTextStyle as TextStyle),
              ...(inputSurface.style as TextStyle | undefined),
            }}
            value={localValue}
            onChangeText={handleChange}
            onSubmitEditing={handleSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={config.placeholder ?? 'Search...'}
            placeholderTextColor={tokens.colors.inputPlaceholder}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={config.placeholder ?? 'Search'}
            testID={`${testIDBase}-input`}
          />
          {localValue.length > 0 ? (
            <TouchableOpacity
              style={clearButtonSurface.style as ViewStyle | undefined}
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID={`${testIDBase}-clear`}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(clearIconSurface.style as TextStyle | undefined),
                }}
              >
                X
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {showCancel ? (
          <Animated.View
            style={{
              opacity: cancelSlide,
              transform: [
                {
                  translateX: cancelSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              style={cancelButtonSurface.style as ViewStyle | undefined}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
              testID={`${testIDBase}-cancel`}
            >
              <Text
                style={{
                  ...sharedTextStyle,
                  ...(cancelTextSurface.style as TextStyle | undefined),
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}
