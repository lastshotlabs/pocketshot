import React, { useMemo, useState } from 'react'
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

export type RegisterFieldName = 'email' | 'username' | 'password' | 'confirmPassword'

const FIELD_LABELS: Record<RegisterFieldName, string> = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  confirmPassword: 'Confirm Password',
}

const FIELD_PLACEHOLDERS: Record<RegisterFieldName, string> = {
  email: 'you@example.com',
  username: 'username',
  password: '••••••••',
  confirmPassword: '••••••••',
}

export interface RegisterFormBaseProps {
  submitLabel?: string
  /** Fields to render. Default: ['email', 'password']. */
  fields?: RegisterFieldName[]
  /** Called with all field values when submitted. */
  onSubmit: (values: Record<RegisterFieldName, string>) => void
  /** Called when "Sign in" link is tapped. */
  onLogin?: () => void
  style?: ViewStyle
  testID?: string
  id?: string
}

const ERROR_MARGIN_TOP = 2

/**
 * Standalone RegisterForm — plain React props, no manifest required.
 *
 * @example
 * <RegisterFormBase
 *   submitLabel="Create account"
 *   fields={['email', 'password', 'confirmPassword']}
 *   onSubmit={(values) => signUp(values)}
 * />
 */
export function RegisterFormBase({
  submitLabel = 'Create account',
  fields = ['email', 'password'],
  onSubmit,
  onLogin,
  style,
  testID,
  id,
}: RegisterFormBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])
  const [fieldValues, setFieldValues] = useState<Record<RegisterFieldName, string>>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [focusedField, setFocusedField] = useState<RegisterFieldName | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const baseTestID = testID ?? id ?? 'register'

  const handleFieldChange = (field: RegisterFieldName, text: string) => {
    setFieldValues((prev) => ({ ...prev, [field]: text }))
    if (field === 'confirmPassword' || field === 'password') setPasswordError(null)
  }

  const handleSubmit = () => {
    if (fields.includes('password') && fields.includes('confirmPassword')) {
      if (fieldValues.password !== fieldValues.confirmPassword) {
        setPasswordError('Passwords do not match')
        return
      }
    }
    onSubmit(fieldValues)
  }

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
        {fields.map((field) => {
          const isSecure = field === 'password' || field === 'confirmPassword'
          const isEmail = field === 'email'
          const isFocused = focusedField === field
          const showError = field === 'confirmPassword' && passwordError != null
          return (
            <View key={field} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel} accessibilityRole="text">
                {FIELD_LABELS[field]}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isFocused && styles.inputFocused,
                  showError && styles.inputError,
                ]}
                value={fieldValues[field]}
                onChangeText={(text) => handleFieldChange(field, text)}
                onFocus={() => setFocusedField(field)}
                onBlur={() => setFocusedField(null)}
                placeholder={FIELD_PLACEHOLDERS[field]}
                placeholderTextColor={tokens.colors.inputPlaceholder}
                secureTextEntry={isSecure}
                keyboardType={isEmail ? 'email-address' : 'default'}
                autoCapitalize={isEmail || isSecure ? 'none' : 'words'}
                autoComplete={
                  isEmail
                    ? 'email'
                    : field === 'password'
                      ? 'password-new'
                      : field === 'confirmPassword'
                        ? 'password-new'
                        : 'username'
                }
                returnKeyType="next"
                accessibilityLabel={FIELD_LABELS[field]}
                testID={`${baseTestID}-${field}`}
              />
              {showError && (
                <Text
                  style={styles.errorText}
                  accessibilityRole="text"
                  accessibilityLiveRegion="polite"
                >
                  {passwordError}
                </Text>
              )}
            </View>
          )
        })}
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
        {onLogin != null && (
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={onLogin}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              testID={`${baseTestID}-login`}
            >
              <Text style={styles.loginLink}>Sign in</Text>
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
    inputError: { borderColor: tokens.colors.error },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
      marginTop: ERROR_MARGIN_TOP,
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
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textMuted },
    loginLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}
