import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { ForgotPasswordFormConfig } from './types'

export function ForgotPasswordForm({ config }: { config: ForgotPasswordFormConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const styles = makeStyles(tokens)

  function handleEmailChange(text: string) {
    setEmail(text)
    setValue('__forgotEmail', text)
  }

  async function handleSubmit() {
    await dispatch(config.onSubmit)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            We've sent a password reset link to {email}. Check your inbox and follow the
            instructions.
          </Text>
          {config.backAction != null && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => void dispatch(config.backAction!)}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              activeOpacity={0.8}
              testID={config.testID ? `${config.testID}-back` : 'forgot-password-back'}
            >
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <Text style={styles.instructions}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel} accessibilityRole="text">
              Email
            </Text>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="you@example.com"
              placeholderTextColor={tokens.colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
              accessibilityLabel="Email"
              accessibilityRole="none"
              testID={config.testID ? `${config.testID}-email` : 'forgot-password-email'}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => void handleSubmit()}
            accessibilityRole="button"
            accessibilityLabel={config.submitLabel}
            activeOpacity={0.8}
            testID={config.testID ? `${config.testID}-submit` : 'forgot-password-submit'}
          >
            <Text style={styles.submitLabel}>{config.submitLabel}</Text>
          </TouchableOpacity>

          {config.backAction != null && (
            <TouchableOpacity
              style={styles.backLinkContainer}
              onPress={() => void dispatch(config.backAction!)}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
              testID={config.testID ? `${config.testID}-back` : 'forgot-password-back'}
            >
              <Text style={styles.backLink}>← Back to Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    container: {
      padding: tokens.spacing[4],
      gap: tokens.spacing[4],
    },
    instructions: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    fieldContainer: {
      gap: tokens.spacing[1],
    },
    fieldLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    input: {
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    inputFocused: {
      borderColor: tokens.colors.borderFocus,
    },
    submitButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitLabel: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
    backLinkContainer: {
      alignItems: 'center',
      paddingVertical: tokens.spacing[2],
    },
    backLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    successContainer: {
      padding: tokens.spacing[6],
      alignItems: 'center',
      gap: tokens.spacing[4],
    },
    successIcon: {
      fontSize: tokens.typography.fontSize5xl,
    },
    successTitle: {
      fontSize: tokens.typography.fontSize2xl,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.text,
      textAlign: 'center',
    },
    successBody: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      textAlign: 'center',
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    backButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[6],
      alignItems: 'center',
      marginTop: tokens.spacing[2],
    },
    backButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}
