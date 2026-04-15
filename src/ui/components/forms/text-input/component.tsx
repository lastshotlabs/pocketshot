import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TextInput as RNTextInput, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { TextInputConfig } from './types'

export function TextInput({ config }: { config: TextInputConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue = config.value != null ? resolveFromRef(config.value, values) : undefined
  const resolvedError =
    config.errorText != null ? resolveFromRef(config.errorText, values) : undefined

  const [localValue, setLocalValue] = useState<string>(resolvedValue ?? config.defaultValue ?? '')
  const [focused, setFocused] = useState(false)

  // Sync controlled value from screen context
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

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
          </Text>
        )}
        <RNTextInput
          style={styles.input}
          value={localValue}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={config.placeholder}
          placeholderTextColor={tokens.colors.inputPlaceholder}
          secureTextEntry={config.secureTextEntry}
          keyboardType={config.keyboardType}
          autoCapitalize={config.autoCapitalize}
          autoComplete={config.autoComplete as never}
          multiline={config.multiline}
          numberOfLines={config.multiline ? (config.numberOfLines ?? 4) : undefined}
          maxLength={config.maxLength}
          accessibilityLabel={config.label ?? config.placeholder ?? config.id}
          testID={config.testID ? `${config.testID}-input` : `${config.id}-input`}
        />
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
    input: {
      backgroundColor: tokens.colors.inputBackground,
      borderColor,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
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

