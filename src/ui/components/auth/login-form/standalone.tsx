import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

const SOCIAL_LABELS: Record<string, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  github: 'Continue with GitHub',
}

export interface LoginFormBaseProps {
  /** Submit button label. */
  submitLabel?: string
  /** Called with the entered credentials when the user submits the form. */
  onSubmit: (values: { email: string; password: string }) => void
  /** Called when the user taps "Forgot password?". If undefined, link is hidden. */
  onForgotPassword?: () => void
  /** Called when the user taps "Sign up". If undefined, link is hidden. */
  onRegister?: () => void
  /** Show social provider buttons. */
  showSocialButtons?: boolean
  /** Social providers to render (google/apple/github). */
  socialProviders?: string[]
  style?: ViewStyle
  testID?: string
  id?: string
}

/**
 * Standalone LoginForm — plain React props, no manifest required.
 *
 * @example
 * <LoginFormBase
 *   submitLabel="Sign in"
 *   onSubmit={({ email, password }) => signIn(email, password)}
 * />
 */
export function LoginFormBase({
  submitLabel = 'Sign in',
  onSubmit,
  onForgotPassword,
  onRegister,
  showSocialButtons,
  socialProviders,
  style,
  testID,
  id,
}: LoginFormBaseProps) {
  const tokens = useTokens()
  const styles = makeStyles(tokens)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = () => onSubmit({ email, password })
  const baseTestID = testID ?? id ?? 'login'

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardView, style]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel} accessibilityRole="text">
            Email
          </Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="you@example.com"
            placeholderTextColor={tokens.colors.inputPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            accessibilityLabel="Email"
            testID={`${baseTestID}-email`}
          />
        </View>
        <View style={styles.fieldContainer}>
          <View style={styles.passwordLabelRow}>
            <Text style={styles.fieldLabel} accessibilityRole="text">
              Password
            </Text>
            {onForgotPassword != null && (
              <TouchableOpacity
                onPress={onForgotPassword}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID={`${baseTestID}-forgot`}
              >
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="••••••••"
            placeholderTextColor={tokens.colors.inputPlaceholder}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Password"
            testID={`${baseTestID}-password`}
          />
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          activeOpacity={0.8}
          testID={`${baseTestID}-submit`}
        >
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        </TouchableOpacity>
        {showSocialButtons && (socialProviders ?? []).length > 0 && (
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            {(socialProviders ?? []).map((provider) => (
              <View key={provider} style={styles.socialButton}>
                <Text style={styles.socialButtonText}>{SOCIAL_LABELS[provider] ?? provider}</Text>
              </View>
            ))}
          </View>
        )}
        {onRegister != null && (
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={onRegister}
              accessibilityRole="link"
              accessibilityLabel="Create account"
              testID={`${baseTestID}-register`}
            >
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: { padding: tokens.spacing[4], gap: tokens.spacing[4] },
    fieldContainer: { gap: tokens.spacing[1] },
    fieldLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    passwordLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    forgotLink: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.primary,
      fontWeight: tokens.typography.fontWeightMedium,
    },
    submitButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: tokens.spacing[2],
    },
    submitLabel: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
    socialSection: { gap: tokens.spacing[3] },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3] },
    divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: tokens.colors.divider },
    dividerText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted },
    socialButton: {
      borderWidth: 1,
      borderColor: tokens.colors.border,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.colors.surface,
    },
    socialButtonText: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
    },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: tokens.spacing[2],
    },
    registerText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted },
    registerLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}
