import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface ForgotPasswordFormBaseProps {
  submitLabel?: string
  /** Called with the entered email when submitted. */
  onSubmit: (values: { email: string }) => Promise<void> | void
  /** Called when the user taps "Back to Sign In". */
  onBack?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone ForgotPasswordForm — plain React props, no manifest required.
 *
 * @example
 * <ForgotPasswordFormBase
 *   submitLabel="Send reset link"
 *   onSubmit={async ({ email }) => sendReset(email)}
 *   onBack={() => navigation.goBack()}
 * />
 */
export function ForgotPasswordFormBase({
  submitLabel = 'Send reset link',
  onSubmit,
  onBack,
  style,
  testID,
  id,
}: ForgotPasswordFormBaseProps) {
  const tokens = useTokens()
  const styles = makeStyles(tokens)
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const baseTestID = testID ?? id ?? 'forgot-password'

  const handleSubmit = async () => {
    await onSubmit({ email })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <View style={[styles.successContainer, style]}>
        <Text style={styles.successIcon}>✉️</Text>
        <Text style={styles.successTitle}>Check your email</Text>
        <Text style={styles.successBody}>
          We've sent a password reset link to {email}. Check your inbox and follow the
          instructions.
        </Text>
        {onBack != null && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            activeOpacity={0.8}
            testID={`${baseTestID}-back`}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardView, style]}
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
            onChangeText={setEmail}
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
            testID={`${baseTestID}-email`}
          />
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => void handleSubmit()}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          activeOpacity={0.8}
          testID={`${baseTestID}-submit`}
        >
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        </TouchableOpacity>
        {onBack != null && (
          <TouchableOpacity
            style={styles.backLinkContainer}
            onPress={onBack}
            accessibilityRole="link"
            accessibilityLabel="Back to sign in"
            testID={`${baseTestID}-back`}
          >
            <Text style={styles.backLink}>← Back to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    keyboardView: { flex: 1 },
    container: { padding: tokens.spacing[4], gap: tokens.spacing[4] },
    instructions: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.textMuted,
      lineHeight: tokens.typography.fontSizeMd * tokens.typography.lineHeightNormal,
    },
    fieldContainer: { gap: tokens.spacing[1] },
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
    inputFocused: { borderColor: tokens.colors.borderFocus },
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
    backLinkContainer: { alignItems: 'center', paddingVertical: tokens.spacing[2] },
    backLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
    successContainer: { padding: tokens.spacing[6], alignItems: 'center', gap: tokens.spacing[4] },
    successIcon: { fontSize: tokens.typography.fontSize5xl },
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
