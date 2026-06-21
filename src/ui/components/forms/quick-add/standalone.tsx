import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface QuickAddBaseProps {
  /** Controlled input value. */
  value?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Called whenever the input changes. */
  onChangeText?: (text: string) => void
  /** Called when the user submits a non-empty value. */
  onSubmit?: (text: string) => void
  /** Placeholder for the input. */
  placeholder?: string
  /** Optional icon glyph rendered to the left. */
  icon?: string
  /** Submit button label or glyph. Defaults to '+'. */
  submitLabel?: string
  /** Style applied to the row container. */
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone QuickAdd — single-line input with a submit button that clears on submit.
 *
 * @example
 * <QuickAddBase placeholder="Add a task…" onSubmit={addTask} />
 */
export function QuickAddBase({
  value,
  defaultValue,
  onChangeText,
  onSubmit,
  placeholder,
  icon,
  submitLabel,
  style,
  testID,
  id,
}: QuickAddBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [internal, setInternal] = useState(defaultValue ?? '')
  const isControlled = value !== undefined
  const current = isControlled ? (value ?? '') : internal
  const inputRef = useRef<RNTextInput>(null)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handleChange = useCallback(
    (text: string) => {
      if (!isControlled) setInternal(text)
      onChangeText?.(text)
    },
    [isControlled, onChangeText],
  )

  const handleSubmit = useCallback(() => {
    const trimmed = current.trim()
    if (trimmed.length === 0) return

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4,
      }),
    ]).start()

    onSubmit?.(trimmed)
    if (!isControlled) setInternal('')
  }, [current, isControlled, onSubmit, scaleAnim])

  const testIDBase = testID ?? id
  const hasValue = current.trim().length > 0

  return (
    <View style={[styles.container, style]}>
      {icon != null ? (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      ) : null}
      <RNTextInput
        ref={inputRef}
        style={styles.input}
        value={current}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        returnKeyType="done"
        accessibilityLabel={placeholder ?? 'Add item'}
        testID={testIDBase ? `${testIDBase}-input` : undefined}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.submitButton, !hasValue && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!hasValue}
          accessibilityRole="button"
          accessibilityLabel={submitLabel ?? 'Add'}
          accessibilityState={{ disabled: !hasValue }}
          testID={testIDBase ? `${testIDBase}-submit` : undefined}
        >
          <Text style={[styles.submitText, !hasValue && styles.submitTextDisabled]}>
            {submitLabel ?? '+'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingLeft: tokens.spacing[3],
      gap: tokens.spacing[2],
    },
    icon: {
      fontSize: tokens.typography.fontSizeMd,
    },
    input: {
      flex: 1,
      paddingVertical: tokens.spacing[2],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    submitButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      marginRight: tokens.spacing[1],
      marginVertical: tokens.spacing[1],
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: tokens.colors.muted,
    },
    submitText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
    submitTextDisabled: {
      color: tokens.colors.mutedForeground,
    },
  })
}
