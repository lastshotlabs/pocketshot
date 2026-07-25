import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export interface AutoFormFieldOption {
  label: string
  value: string
}

export interface AutoFormFieldDefinition {
  id: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'switch'
  placeholder?: string
  required?: boolean
  defaultValue?: unknown
  options?: AutoFormFieldOption[]
}

export interface AutoFormBaseProps {
  /** Field definitions rendered as form rows. */
  fields: AutoFormFieldDefinition[]
  /** Submit button label (default: "Submit"). */
  submitLabel?: string
  /** Called with the form values when the user submits. */
  onSubmit?: (values: Record<string, unknown>) => void
  /** Optional map of `{ fieldId: errorMessage }`. */
  validationErrors?: Record<string, string>
  /** Style applied to root container. */
  style?: ViewStyle
  testID?: string
  id?: string
}

interface FieldProps {
  field: AutoFormFieldDefinition
  value: unknown
  onChange: (v: unknown) => void
  tokens: DesignTokens
  errorText?: string
  formId: string
}

function TextField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const [focused, setFocused] = useState(false)
  const hasError = Boolean(errorText)
  const fStyles = useMemo(() => fieldStyles(tokens), [tokens])
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
    <View style={fStyles.container}>
      <Text style={fStyles.label}>
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
        style={[fStyles.input, { borderColor }]}
        accessibilityLabel={field.label}
        testID={`${formId}-field-${field.id}`}
      />
      {hasError && errorText ? (
        <Text style={fStyles.errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

function SelectField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const [modalVisible, setModalVisible] = useState(false)
  const fStyles = useMemo(() => fieldStyles(tokens), [tokens])
  const options = field.options ?? []
  const selected = options.find((o) => o.value === value)
  const hasError = Boolean(errorText)
  const placeholder = field.placeholder ?? 'Select an option'

  return (
    <View style={fStyles.container}>
      <Text style={fStyles.label}>
        {field.label}
        {field.required && <Text style={{ color: tokens.colors.error }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          fStyles.input,
          fStyles.selectTrigger,
          hasError && { borderColor: tokens.colors.error },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={field.label}
        accessibilityHint="Opens a list of options"
        testID={`${formId}-field-${field.id}`}
      >
        <Text
          style={[fStyles.inputText, !selected && { color: tokens.colors.inputPlaceholder }]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text style={{ fontSize: tokens.typography.fontSizeXs, color: tokens.colors.textMuted }}>
          ▼
        </Text>
      </TouchableOpacity>
      {hasError && errorText ? (
        <Text style={fStyles.errorText} accessibilityLiveRegion="polite">
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
              <FlatList<AutoFormFieldOption>
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
  const fStyles = useMemo(() => fieldStyles(tokens), [tokens])

  return (
    <View style={fStyles.container}>
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
        <Text style={fStyles.errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

function SwitchField({ field, value, onChange, tokens, errorText, formId }: FieldProps) {
  const isOn = (value as boolean | undefined) ?? false
  const fStyles = useMemo(() => fieldStyles(tokens), [tokens])

  return (
    <View style={fStyles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[fStyles.label, { flex: 1, marginRight: tokens.spacing[3] }]}>
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
        <Text style={fStyles.errorText} accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : null}
    </View>
  )
}

function fieldStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { gap: tokens.spacing[1] },
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
    selectTrigger: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
    errorText: { fontSize: tokens.typography.fontSizeXs, color: tokens.colors.error },
  })
}

function getDefaultValue(field: AutoFormFieldDefinition): unknown {
  if (field.defaultValue != null) return field.defaultValue
  if (field.type === 'checkbox' || field.type === 'switch') return false
  if (field.type === 'number') return 0
  return ''
}

function renderField(
  field: AutoFormFieldDefinition,
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

/**
 * Standalone AutoForm — render a form from field definitions.
 *
 * @example
 * <AutoFormBase
 *   fields={[{ id: 'email', label: 'Email', type: 'email', required: true }]}
 *   submitLabel="Save"
 *   onSubmit={(values) => save(values)}
 * />
 */
export function AutoFormBase({
  fields,
  submitLabel = 'Submit',
  onSubmit,
  validationErrors,
  style,
  testID,
  id,
}: AutoFormBaseProps) {
  const tokens = useTokens()
  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const [formState, setFormState] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const field of fields) initial[field.id] = getDefaultValue(field)
    return initial
  })

  const updateField = useCallback((fieldId: string, value: unknown) => {
    setFormState((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit?.(formState)
  }, [formState, onSubmit])

  const formId = id ?? testID ?? 'auto-form'
  const testIDBase = testID ?? id

  return (
    <View style={[styles.container, style]}>
      {fields.map((field) =>
        renderField(
          field,
          formState[field.id],
          (v) => updateField(field.id, v),
          tokens,
          validationErrors?.[field.id],
          formId,
        ),
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        testID={testIDBase ? `${testIDBase}-submit` : undefined}
      >
        <Text style={styles.submitLabel}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    container: { gap: tokens.spacing[4] },
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
