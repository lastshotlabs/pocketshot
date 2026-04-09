import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { RegisterFormConfig } from './types'

type FieldName = 'email' | 'username' | 'password' | 'confirmPassword'

const FIELD_LABELS: Record<FieldName, string> = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  confirmPassword: 'Confirm Password',
}

const FIELD_PLACEHOLDERS: Record<FieldName, string> = {
  email: 'you@example.com',
  username: 'username',
  password: '••••••••',
  confirmPassword: '••••••••',
}

export function RegisterForm({ config }: { config: RegisterFormConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [fieldValues, setFieldValues] = useState<Record<FieldName, string>>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [focusedField, setFocusedField] = useState<FieldName | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  function handleFieldChange(field: FieldName, text: string) {
    setFieldValues((prev) => ({ ...prev, [field]: text }))
    setValue(`__register_${field}`, text)
    if (field === 'confirmPassword' || field === 'password') {
      setPasswordError(null)
    }
  }

  function handleSubmit() {
    const hasPassword = (config.fields ?? ['email', 'password']).includes('password')
    const hasConfirm = (config.fields ?? ['email', 'password']).includes('confirmPassword')

    if (hasPassword && hasConfirm) {
      if (fieldValues.password !== fieldValues.confirmPassword) {
        setPasswordError('Passwords do not match')
        return
      }
    }

    void dispatch(config.onSubmit)
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {(config.fields ?? ['email', 'password']).map((field) => {
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
                  testID={config.testID ? `${config.testID}-${field}` : `register-${field}`}
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
            accessibilityLabel={config.submitLabel}
            activeOpacity={0.8}
            testID={config.testID ? `${config.testID}-submit` : 'register-submit'}
          >
            <Text style={styles.submitLabel}>{config.submitLabel}</Text>
          </TouchableOpacity>

          {config.loginAction != null && (
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => void dispatch(config.loginAction!)}
                accessibilityRole="link"
                accessibilityLabel="Sign in"
                testID={config.testID ? `${config.testID}-login` : 'register-login'}
              >
                <Text style={styles.loginLink}>Sign in</Text>
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
    inputError: {
      borderColor: tokens.colors.error,
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
      marginTop: 2,
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
    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginText: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
    },
    loginLink: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.primary,
    },
  })
}
