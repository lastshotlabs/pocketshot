import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { PasswordInputConfig } from './types'

export function PasswordInput({ config }: { config: PasswordInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError =
    config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

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
  const styles = useMemo(() => makeStyles(tokens, focused, hasError), [tokens, focused, hasError])

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      setValue(config.id, text)
      if (config.onChangeAction) {
        void dispatch(config.onChangeAction)
      }
    },
    [config.id, config.onChangeAction, setValue, dispatch],
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

  const showToggle = config.showToggle ?? true
  const testIDBase = config.testID ?? config.id

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <View style={styles.inputRow}>
          <RNTextInput
            style={styles.input}
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
          {showToggle && (
            <Animated.View style={{ opacity: opacityAnim }}>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={toggleSecureEntry}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={secureEntry ? 'Show password' : 'Hide password'}
                accessibilityHint="Toggles password visibility"
                testID={`${testIDBase}-toggle`}
              >
                <Text style={styles.eyeIcon}>{secureEntry ? '👁' : '👁‍🗨'}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
        {hasError && resolvedError ? (
          <Text style={styles.errorText} accessibilityRole="text" accessibilityLiveRegion="polite">
            {resolvedError as string}
          </Text>
        ) : config.helperText != null ? (
          <Text style={styles.helperText} accessibilityRole="text">
            {config.helperText}
          </Text>
        ) : null}
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens, focused: boolean, hasError: boolean) {
  const borderColor = hasError
    ? tokens.colors.error
    : focused
      ? tokens.colors.borderFocus
      : tokens.colors.inputBorder

  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.inputBackground,
      borderColor,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
    },
    input: {
      flex: 1,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    eyeButton: {
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[2],
      justifyContent: 'center',
      alignItems: 'center',
    },
    eyeIcon: {
      fontSize: tokens.typography.fontSizeLg,
    },
    helperText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
      marginTop: tokens.spacing[1],
    },
  })
}
