import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { LoginFormConfig } from './types'

const SOCIAL_LABELS: Record<string, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
  github: 'Continue with GitHub',
}

export function LoginForm({ config }: { config: LoginFormConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const styles = makeStyles(tokens)

  function handleEmailChange(text: string) {
    setEmail(text)
    setValue('__loginEmail', text)
  }

  function handlePasswordChange(text: string) {
    setPassword(text)
    setValue('__loginPassword', text)
  }

  function handleSubmit() {
    void dispatch(config.onSubmit)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Email field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel} accessibilityRole="text">
              Email
            </Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              value={email}
              onChangeText={handleEmailChange}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="you@example.com"
              placeholderTextColor={tokens.colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              accessibilityLabel="Email"
              accessibilityRole="none"
              testID={config.testID ? `${config.testID}-email` : 'login-email'}
            />
          </View>

          {/* Password field */}
          <View style={styles.fieldContainer}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.fieldLabel} accessibilityRole="text">
                Password
              </Text>
              {config.forgotPasswordAction != null && (
                <TouchableOpacity
                  onPress={() => void dispatch(config.forgotPasswordAction!)}
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  testID={config.testID ? `${config.testID}-forgot` : 'login-forgot'}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              value={password}
              onChangeText={handlePasswordChange}
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
              accessibilityRole="none"
              testID={config.testID ? `${config.testID}-password` : 'login-password'}
            />
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={config.submitLabel}
            activeOpacity={0.8}
            testID={config.testID ? `${config.testID}-submit` : 'login-submit'}
          >
            <Text style={styles.submitLabel}>{config.submitLabel}</Text>
          </TouchableOpacity>

          {/* Social buttons */}
          {config.showSocialButtons && (config.socialProviders ?? []).length > 0 && (
            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>
              {(config.socialProviders ?? []).map((provider) => (
                <View key={provider} style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>{SOCIAL_LABELS[provider] ?? provider}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Register link */}
          {config.registerAction != null && (
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => void dispatch(config.registerAction!)}
                accessibilityRole="link"
                accessibilityLabel="Create account"
                testID={config.testID ? `${config.testID}-register` : 'login-register'}
              >
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing[4],
      gap: tokens.spacing[4],
    },
    fieldContainer: {
      gap: tokens.spacing[1],
    },
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
    inputFocused: {
      borderColor: tokens.colors.borderFocus,
    },
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
    socialSection: {
      gap: tokens.spacing[3],
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[3],
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.colors.divider,
    },
    dividerText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
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
    registerText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    registerLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}

