import React, { useState, useCallback, useMemo, useRef } from 'react'
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
import type { QuickAddConfig } from './types'

export function QuickAdd({ config }: { config: QuickAddConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [localValue, setLocalValue] = useState('')
  const inputRef = useRef<RNTextInput>(null)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const handleSubmit = useCallback(() => {
    const trimmed = localValue.trim()
    if (trimmed.length === 0) return

    // Animate the submit button
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

    // Publish the value before dispatching
    setValue(config.id, trimmed)
    void dispatch(config.onSubmit)

    // Clear after submit
    setLocalValue('')
  }, [localValue, scaleAnim, config.id, config.onSubmit, setValue, dispatch])

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
    },
    [],
  )

  const testIDBase = config.testID ?? config.id
  const hasValue = localValue.trim().length > 0

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.icon != null && (
          <Text style={styles.icon} accessibilityElementsHidden>
            {config.icon}
          </Text>
        )}
        <RNTextInput
          ref={inputRef}
          style={styles.input}
          value={localValue}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          placeholder={config.placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          returnKeyType="done"
          accessibilityLabel={config.placeholder ?? 'Add item'}
          testID={`${testIDBase}-input`}
        />
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.submitButton, !hasValue && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!hasValue}
            accessibilityRole="button"
            accessibilityLabel={config.submitLabel ?? 'Add'}
            accessibilityState={{ disabled: !hasValue }}
            testID={`${testIDBase}-submit`}
          >
            <Text style={[styles.submitText, !hasValue && styles.submitTextDisabled]}>
              {config.submitLabel ?? '+'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ComponentWrapper>
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

