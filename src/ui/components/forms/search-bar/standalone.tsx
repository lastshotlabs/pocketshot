import React, { useEffect, useRef, useState } from 'react'
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

export interface SearchBarBaseProps {
  /** Controlled query value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called whenever the input changes (debounced). */
  onChangeText?: (text: string) => void
  /** Called when the user submits the search (Return key). */
  onSubmit?: (text: string) => void
  /** Called when the user taps Cancel. */
  onCancel?: () => void
  /** Placeholder text. */
  placeholder?: string
  /** Auto-focus the input on mount. */
  autoFocus?: boolean
  /** Show the cancel button on the right. */
  showCancelButton?: boolean
  /** Debounce in milliseconds before firing onChangeText. */
  debounceMs?: number
  /** Slot overrides. */
  slots?: Record<string, Record<string, unknown>>
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone SearchBar — debounced text input with clear/cancel buttons.
 *
 * @example
 * <SearchBarBase placeholder="Search…" onChangeText={setQuery} />
 */
export function SearchBarBase({
  value,
  defaultValue,
  onChangeText,
  onSubmit,
  onCancel,
  placeholder,
  autoFocus,
  showCancelButton = false,
  debounceMs = 300,
  slots,
  style,
  testID,
  id,
}: SearchBarBaseProps) {
  const tokens = useTokens()
  const sharedTextStyle = resolveNativeTextStyle({}, tokens)
  const [internal, setInternal] = useState(defaultValue ?? '')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<RNTextInput>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelSlide = useRef(new Animated.Value(0)).current

  const isControlled = value !== undefined
  const currentValue = isControlled ? (value ?? '') : internal

  const activeStates: RuntimeSurfaceState[] = focused ? ['focus'] : []

  useEffect(() => {
    if (!showCancelButton) return
    Animated.timing(cancelSlide, {
      toValue: focused || currentValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [cancelSlide, focused, currentValue, showCancelButton])

  useEffect(() => {
    if (autoFocus) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [autoFocus])

  const rowSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flexDirection: 'row', alignItems: 'center', gap: 'xs' },
    componentSurface: slots?.row,
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
    componentSurface: slots?.inputContainer,
    activeStates,
  })
  const searchIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', marginRight: 'xs' },
    componentSurface: slots?.searchIcon,
    activeStates,
  })
  const inputSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { flex: 1, paddingY: 'sm', fontSize: 'base', color: 'inputText' },
    componentSurface: slots?.input,
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
    componentSurface: slots?.clearButton,
    activeStates,
  })
  const clearIconSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'sm', color: 'muted', fontWeight: 'bold' },
    componentSurface: slots?.clearIcon,
    activeStates,
  })
  const cancelButtonSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { paddingY: 'xs', paddingX: 'xs' },
    componentSurface: slots?.cancelButton,
    activeStates,
  })
  const cancelTextSurface = resolveSurfacePresentation({
    tokens,
    implementationBase: { fontSize: 'base', color: 'primary', fontWeight: 'medium' },
    componentSurface: slots?.cancelText,
    activeStates,
  })

  function publish(text: string) {
    onChangeText?.(text)
  }

  function handleChange(text: string) {
    if (!isControlled) setInternal(text)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => publish(text), debounceMs)
  }

  function handleClear() {
    if (!isControlled) setInternal('')
    publish('')
    inputRef.current?.focus()
  }

  function handleCancel() {
    if (!isControlled) setInternal('')
    publish('')
    inputRef.current?.blur()
    onCancel?.()
  }

  function handleSubmit() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    onSubmit?.(currentValue)
  }

  const testIDBase = testID ?? id

  return (
    <View style={[rowSurface.style as ViewStyle | undefined, style]}>
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
          value={currentValue}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? 'Search...'}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={placeholder ?? 'Search'}
          testID={testIDBase ? `${testIDBase}-input` : undefined}
        />
        {currentValue.length > 0 ? (
          <TouchableOpacity
            style={clearButtonSurface.style as ViewStyle | undefined}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            testID={testIDBase ? `${testIDBase}-clear` : undefined}
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
      {showCancelButton ? (
        <Animated.View
          style={{
            opacity: cancelSlide,
            transform: [
              {
                translateX: cancelSlide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={cancelButtonSurface.style as ViewStyle | undefined}
            accessibilityRole="button"
            accessibilityLabel="Cancel search"
            testID={testIDBase ? `${testIDBase}-cancel` : undefined}
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
  )
}
