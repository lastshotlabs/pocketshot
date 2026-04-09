import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { AutoFormConfig, AutoFormField } from './types'

// ── Inline field renderers — no imports from sibling components ─────────────

interface FieldOption {
  label: string
  value: string
}

interface FieldProps {
  field: AutoFormField
  value: unknown
  onChange: (v: unknown) => void
  tokens: DesignTokens
  errorText?: string
  formId: string
}

function TextField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const [focused, setFocused] = useState(false)
  const hasError = Boolean(errorText)
  const borderColor = hasError
    ? tokens.colors.error
    : focused
      ? tokens.colors.borderFocus
      : tokens.colors.inputBorder

  const keyboardType =
    field.type === 'email'
      ? ('email-address' as const)
      : field.type === 'number'
        ? ('numeric' as const)
        : ('default' as const)

  return (
    <View style={fieldStyles(tokens).container}>
      <Text style={fieldStyles(tokens).label}>
        {field.label}
        {field.required && <Text style={{ color: tokens.colors.error }}> *</Text>}
      </Text>
      <TextInput
        value={(value as string | undefined) ?? ''}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field.placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        secureTextEntry={field.type === 'password'}
        keyboardType={keyboardType}
        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
        style={[fieldStyles(tokens).input, { borderColor }]}
        accessibilityLabel={field.label}
        accessibilityRole="none"
        testID={`${formId}-field-${field.id}`}
      />
      {hasError && errorText ? (
        <Text style={fieldStyles(tokens).errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

function SelectField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const [modalVisible, setModalVisible] = useState(false)
  const options: FieldOption[] = field.options ?? []
  const selected = options.find((o) => o.value === value)
  const hasError = Boolean(errorText)
  const placeholder = field.placeholder ?? 'Select an option'

  return (
    <View style={fieldStyles(tokens).container}>
      <Text style={fieldStyles(tokens).label}>
        {field.label}
        {field.required && <Text style={{ color: tokens.colors.error }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          fieldStyles(tokens).input,
          fieldStyles(tokens).selectTrigger,
          hasError && { borderColor: tokens.colors.error },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={field.label}
        accessibilityHint="Opens a list of options"
        testID={`${formId}-field-${field.id}`}
      >
        <Text
          style={[
            fieldStyles(tokens).inputText,
            !selected && { color: tokens.colors.inputPlaceholder },
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text style={{ fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted }}>
          ▼
        </Text>
      </TouchableOpacity>
      {hasError && errorText ? (
        <Text style={fieldStyles(tokens).errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: tokens.colors.overlay + 'CC',
            justifyContent: 'flex-end',
          }}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close options"
        >
          <SafeAreaView
            style={{
              backgroundColor: tokens.colors.surface,
              borderTopLeftRadius: tokens.radius.xl,
              borderTopRightRadius: tokens.radius.xl,
              maxHeight: '60%',
              ...Platform.select({ android: { paddingBottom: tokens.spacing[4] } }),
            }}
          >
            <View style={{ padding: tokens.spacing[4] }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSizeLg,
                  fontWeight: tokens.typography.fontWeightSemibold,
                  color: tokens.colors.text,
                  marginBottom: tokens.spacing[3],
                }}
              >
                {field.label}
              </Text>
              <FlatList<FieldOption>
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const isSelected = item.value === value
                  return (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: tokens.spacing[3],
                        paddingHorizontal: tokens.spacing[2],
                        borderRadius: tokens.radius.md,
                        backgroundColor: isSelected ? tokens.colors.surfaceAlt : 'transparent',
                      }}
                      onPress={() => {
                        onChange(item.value)
                        setModalVisible(false)
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: isSelected }}
                      testID={`${formId}-field-${field.id}-option-${item.value}`}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: tokens.typography.fontSizeMd,
                          color: isSelected ? tokens.colors.primary : tokens.colors.text,
                          fontWeight: isSelected
                            ? tokens.typography.fontWeightSemibold
                            : tokens.typography.fontWeightRegular,
                        }}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Text
                          style={{
                            color: tokens.colors.primary,
                            fontSize: tokens.typography.fontSizeMd,
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

function CheckboxField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const checked = (value as boolean | undefined) ?? false

  return (
    <View style={fieldStyles(tokens).container}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3] }}
        onPress={() => onChange(!checked)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityLabel={field.label}
        accessibilityState={{ checked }}
        testID={`${formId}-field-${field.id}`}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: tokens.radius.sm,
            borderWidth: 2,
            borderColor: checked ? tokens.colors.primary : tokens.colors.inputBorder,
            backgroundColor: checked ? tokens.colors.primary : tokens.colors.inputBackground,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && (
            <Text
              style={{
                fontSize: tokens.typography.fontSizeXs,
                color: tokens.colors.primaryForeground,
                fontWeight: tokens.typography.fontWeightBold,
                lineHeight: 16,
              }}
            >
              ✓
            </Text>
          )}
        </View>
        <Text
          style={{ flex: 1, fontSize: tokens.typography.fontSizeMd, color: tokens.colors.text }}
        >
          {field.label}
          {field.required && <Text style={{ color: tokens.colors.error }}> *</Text>}
        </Text>
      </TouchableOpacity>
      {errorText ? (
        <Text style={fieldStyles(tokens).errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

function SwitchField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const isOn = (value as boolean | undefined) ?? false

  return (
    <View style={fieldStyles(tokens).container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[fieldStyles(tokens).label, { flex: 1, marginRight: tokens.spacing[3] }]}>
          {field.label}
          {field.required && <Text style={{ color: tokens.colors.error }}> *</Text>}
        </Text>
        <Switch
          value={isOn}
          onValueChange={onChange}
          trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
          thumbColor={tokens.colors.primaryForeground}
          ios_backgroundColor={tokens.colors.border}
          accessibilityLabel={field.label}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOn }}
          testID={`${formId}-field-${field.id}`}
        />
      </View>
      {errorText ? (
        <Text style={fieldStyles(tokens).errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

// ── Field styles factory (called inline to avoid module-level state) ─────────

function fieldStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[1],
    },
    label: {
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
    inputText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    selectTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },
    errorText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
    },
  })
}

// ── AutoForm ─────────────────────────────────────────────────────────────────

function getDefaultValue(field: AutoFormField): unknown {
  if (field.defaultValue != null) return field.defaultValue
  if (field.type === 'checkbox' || field.type === 'switch') return false
  if (field.type === 'number') return 0
  return ''
}

function renderField(
  field: AutoFormField,
  value: unknown,
  onChange: (v: unknown) => void,
  tokens: DesignTokens,
  errorText: string | undefined,
  formId: string,
): React.ReactElement {
  const props: FieldProps = { field, value, onChange, tokens, errorText, formId }

  switch (field.type) {
    case 'select':
      return <SelectField key={field.id} {...props} />
    case 'checkbox':
      return <CheckboxField key={field.id} {...props} />
    case 'switch':
      return <SwitchField key={field.id} {...props} />
    default:
      return <TextField key={field.id} {...props} />
  }
}

export function AutoForm({ config }: { config: AutoFormConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch, values } = useScreenContext()

  const validationErrors =
    config.validationErrors != null
      ? (resolveFromRef(config.validationErrors, values) as Record<string, string> | undefined)
      : undefined

  // Initialise local form state from defaultValues
  const [formState, setFormState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const field of config.fields) {
      initial[field.id] = getDefaultValue(field)
    }
    return initial
  })

  function updateField(id: string, value: unknown) {
    setFormState((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    setValue(config.onSubmitKey ?? '__formData', formState)
    await dispatch(config.onSubmit)
  }

  const styles = makeStyles(tokens)

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View style={styles.container}>
        {config.fields.map((field) =>
          renderField(
            field,
            formState[field.id],
            (v) => updateField(field.id, v),
            tokens,
            validationErrors?.[field.id],
            config.id,
          ),
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => void handleSubmit()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={config.submitLabel}
          testID={`${config.testID ?? config.id}-submit`}
        >
          <Text style={styles.submitLabel}>{config.submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </ComponentWrapper>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: {
      gap: tokens.spacing[4],
    },
    submitButton: {
      backgroundColor: tokens.colors.primary,
      borderRadius: tokens.radius.md,
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      alignItems: 'center',
      marginTop: tokens.spacing[2],
    },
    submitLabel: {
      fontSize: tokens.typography.fontSizeMd,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primaryForeground,
    },
  })
}
