import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { FormFieldConfig } from './types'

export function FormField({
  config,
  children,
}: {
  config: FormFieldConfig
  children?: React.ReactNode
}) {
  const tokens = useTokens()
  const { getValue } = useScreenContext()

  const errorText =
    config.errorKey != null ? (getValue(config.errorKey) as string | undefined) : undefined

  const hasError = Boolean(errorText)
  const styles = makeStyles(tokens, hasError)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.label != null && (
          <Text style={styles.label} accessibilityRole="text">
            {config.label}
            {config.required && (
              <Text style={styles.required} accessibilityLabel="required">
                {' '}*
              </Text>
            )}
          </Text>
        )}

        {children}

        {hasError && errorText ? (
          <Text
            style={styles.errorText}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {errorText}
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

function makeStyles(tokens: DesignTokens, hasError: boolean) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    required: {
      color: tokens.colors.error,
    },
    helperText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
    },
  })
}
