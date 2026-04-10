import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { SearchBarConfig } from './types'

export function SearchBar({ config }: { config: SearchBarConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [localValue, setLocalValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<RNTextInput>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showCancel = config.showCancelButton ?? false
  const cancelSlide = useRef(new Animated.Value(0)).current

  const styles = useMemo(() => makeStyles(tokens, focused), [tokens, focused])

  // Animate cancel button in/out
  useEffect(() => {
    if (!showCancel) return
    Animated.timing(cancelSlide, {
      toValue: focused || localValue.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [focused, localValue, showCancel, cancelSlide])

  // Auto-focus on mount if configured
  useEffect(() => {
    if (config.autoFocus) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [config.autoFocus])

  const publishValue = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
  )

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      const debounceMs = config.debounceMs ?? 300
      debounceTimer.current = setTimeout(() => {
        publishValue(text)
      }, debounceMs)
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
    // Flush any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    setValue(config.id, localValue)
    if (config.onSubmitAction) {
      void dispatch(config.onSubmitAction)
    }
  }, [config.id, config.onSubmitAction, localValue, setValue, dispatch])

  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.searchIcon} accessibilityElementsHidden>
            🔍
          </Text>
          <RNTextInput
            ref={inputRef}
            style={styles.input}
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
            accessibilityRole="search"
            testID={`${testIDBase}-input`}
          />
          {localValue.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID={`${testIDBase}-clear`}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showCancel && (
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
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
              testID={`${testIDBase}-cancel`}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, focused: boolean) {
  const borderColor = focused ? tokens.colors.borderFocus : tokens.colors.inputBorder

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
    },
    searchIcon: {
      fontSize: tokens.typography.fontSizeSm,
      marginRight: tokens.spacing[2],
    },
    input: {
      flex: 1,
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    clearButton: {
      paddingLeft: tokens.spacing[2],
      paddingVertical: tokens.spacing[2],
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearIcon: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightBold,
    },
    cancelButton: {
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[2],
    },
    cancelText: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightMedium,
    },
  })
}
