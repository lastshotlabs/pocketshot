import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import type { DesignTokens } from '../../../tokens/types'
import type { WizardConfig, WizardField, WizardFieldValues, WizardErrors, TransitionDirection } from './types'

// ── Select Field Modal ────────────────────────────────────────────────────────

interface SelectModalProps {
  visible: boolean
  field: WizardField
  selectedValue: string
  tokens: DesignTokens
  onSelect: (value: string) => void
  onClose: () => void
  testIDPrefix: string
}

function SelectModal({
  visible,
  field,
  selectedValue,
  tokens,
  onSelect,
  onClose,
  testIDPrefix,
}: SelectModalProps) {
  const styles = useMemo(() => makeSelectModalStyles(tokens), [tokens])
  const options = field.options ?? []

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Close options"
        testID={`${testIDPrefix}-select-backdrop`}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetInner}>
            <Text style={styles.sheetTitle}>{field.label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected ? styles.optionSelected : null]}
                    onPress={() => onSelect(item.value)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isSelected }}
                    testID={`${testIDPrefix}-option-${item.value}`}
                  >
                    <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                      {item.label}
                    </Text>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Field Renderer ────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: WizardField
  stepId: string
  fieldValues: WizardFieldValues
  errors: WizardErrors
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onFieldChange: (key: string, value: string | boolean) => void
  wizardId: string
}

function FieldRenderer({
  field,
  stepId,
  fieldValues,
  errors,
  tokens,
  styles,
  onFieldChange,
  wizardId,
}: FieldRendererProps) {
  const key = `${stepId}.${field.id}`
  const error = errors[key]
  const rawValue = fieldValues[key]
  const [selectModalVisible, setSelectModalVisible] = useState(false)
  const testIDPrefix = `wizard-${wizardId}-${field.id}`

  if (field.type === 'checkbox') {
    const checked = typeof rawValue === 'boolean' ? rawValue : Boolean(rawValue)
    return (
      <View style={styles.fieldContainer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => onFieldChange(key, !checked)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityLabel={field.label}
          accessibilityState={{ checked }}
          testID={testIDPrefix}
        >
          <View style={[styles.checkboxBox, checked ? styles.checkboxBoxChecked : null]}>
            {checked ? (
              <Text style={styles.checkboxMark}>✓</Text>
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>{field.label}</Text>
        </TouchableOpacity>
        {error ? (
          <Text style={styles.fieldError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : field.helperText ? (
          <Text style={styles.fieldHelper}>{field.helperText}</Text>
        ) : null}
      </View>
    )
  }

  if (field.type === 'select') {
    const strValue = typeof rawValue === 'string' ? rawValue : ''
    const selectedOption = (field.options ?? []).find((o) => o.value === strValue)
    const displayText = selectedOption?.label ?? field.placeholder ?? 'Select…'
    const isPlaceholder = !selectedOption

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <TouchableOpacity
          style={[styles.fieldInput, styles.selectTrigger, error ? styles.fieldInputError : null]}
          onPress={() => setSelectModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={field.label}
          accessibilityHint="Opens a list of options to choose from"
          testID={testIDPrefix}
        >
          <Text
            style={[styles.selectTriggerText, isPlaceholder ? styles.selectPlaceholder : null]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>
        {error ? (
          <Text style={styles.fieldError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : field.helperText ? (
          <Text style={styles.fieldHelper}>{field.helperText}</Text>
        ) : null}
        <SelectModal
          visible={selectModalVisible}
          field={field}
          selectedValue={strValue}
          tokens={tokens}
          onSelect={(value) => {
            onFieldChange(key, value)
            setSelectModalVisible(false)
          }}
          onClose={() => setSelectModalVisible(false)}
          testIDPrefix={testIDPrefix}
        />
      </View>
    )
  }

  // text / email / password / number / textarea
  const strValue = typeof rawValue === 'string' ? rawValue : ''
  const isTextarea = field.type === 'textarea'

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {field.label}
        {field.required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <RNTextInput
        style={[
          styles.fieldInput,
          isTextarea ? styles.textareaInput : null,
          error ? styles.fieldInputError : null,
        ]}
        value={strValue}
        onChangeText={(text) => onFieldChange(key, text)}
        placeholder={field.placeholder}
        placeholderTextColor={tokens.colors.inputPlaceholder}
        secureTextEntry={field.type === 'password'}
        keyboardType={
          field.type === 'number'
            ? 'numeric'
            : field.type === 'email'
              ? 'email-address'
              : 'default'
        }
        autoCapitalize={
          field.type === 'email' || field.type === 'password' ? 'none' : 'sentences'
        }
        multiline={isTextarea}
        numberOfLines={isTextarea ? 4 : undefined}
        textAlignVertical={isTextarea ? 'top' : 'center'}
        accessibilityLabel={field.label}
        testID={testIDPrefix}
      />
      {error ? (
        <Text style={styles.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : field.helperText ? (
        <Text style={styles.fieldHelper}>{field.helperText}</Text>
      ) : null}
    </View>
  )
}

// ── Progress Indicator ────────────────────────────────────────────────────────

interface ProgressProps {
  totalSteps: number
  currentIndex: number
  styles: ReturnType<typeof makeStyles>
}

function ProgressIndicator({ totalSteps, currentIndex, styles }: ProgressProps) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressDots}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < currentIndex
                ? styles.progressDotCompleted
                : i === currentIndex
                  ? styles.progressDotCurrent
                  : styles.progressDotUpcoming,
            ]}
            accessibilityRole="none"
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentIndex + 1} of {totalSteps}
      </Text>
    </View>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Wizard({ config }: { config: WizardConfig }) {
  const tokens = useTokens()
  const { setValue, dispatch } = useScreenContext()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [fieldValues, setFieldValues] = useState<WizardFieldValues>(() => {
    const initial: WizardFieldValues = {}
    for (const step of config.steps) {
      for (const field of step.fields) {
        if (field.defaultValue !== undefined) {
          initial[`${step.id}.${field.id}`] = field.defaultValue
        }
      }
    }
    return initial
  })
  const [errors, setErrors] = useState<WizardErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const slideAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(1)).current

  const styles = useMemo(() => makeStyles(tokens), [tokens])

  const currentStep = config.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === config.steps.length - 1

  // Publish step index to ScreenContext on change
  useEffect(() => {
    setValue(`${config.id}_step`, currentStepIndex)
  }, [config.id, currentStepIndex, setValue])

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = config.steps[stepIndex]
      const newErrors: WizardErrors = {}
      let isValid = true

      for (const field of step.fields) {
        const key = `${step.id}.${field.id}`
        if (!field.required) continue

        const value = fieldValues[key]
        const isEmpty =
          value === undefined ||
          value === '' ||
          value === false ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          newErrors[key] = `${field.label} is required`
          isValid = false
        }
      }

      setErrors((prev) => ({ ...prev, ...newErrors }))
      return isValid
    },
    [config.steps, fieldValues],
  )

  const animateTransition = useCallback(
    (direction: TransitionDirection, onMidpoint: () => void) => {
      const outOffset = direction === 'forward' ? -20 : 20
      const inOffset = direction === 'forward' ? 20 : -20

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: outOffset,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(inOffset)
        onMidpoint()
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start()
      })
    },
    [slideAnim, opacityAnim],
  )

  const handleFieldChange = useCallback((key: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
    // Clear error on change
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleNext = useCallback(() => {
    if (!validateStep(currentStepIndex)) return

    if (isLastStep) {
      // Submit
      setSubmitting(true)
      setValue(config.id, fieldValues)
      setValue(`${config.id}_step`, currentStepIndex)

      if (config.onComplete) {
        void dispatch(config.onComplete).finally(() => setSubmitting(false))
      } else {
        setSubmitting(false)
      }
      return
    }

    animateTransition('forward', () => {
      setCurrentStepIndex((prev) => prev + 1)
    })
  }, [
    validateStep,
    currentStepIndex,
    isLastStep,
    setValue,
    config.id,
    config.onComplete,
    fieldValues,
    dispatch,
    animateTransition,
  ])

  const handleBack = useCallback(() => {
    if (isFirstStep) return
    animateTransition('backward', () => {
      setCurrentStepIndex((prev) => prev - 1)
    })
  }, [isFirstStep, animateTransition])

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      void dispatch(config.onCancel)
    }
  }, [config.onCancel, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
        style={styles.keyboardAvoid}
      >
        <View style={styles.container}>
          {/* Header */}
          {config.title ? (
            <View style={styles.header}>
              <Text style={styles.wizardTitle} accessibilityRole="header">
                {config.title}
              </Text>
            </View>
          ) : null}

          {/* Progress */}
          {config.showProgress ? (
            <ProgressIndicator
              totalSteps={config.steps.length}
              currentIndex={currentStepIndex}
              styles={styles}
            />
          ) : null}

          {/* Step Content */}
          <Animated.View
            style={[
              styles.stepContent,
              {
                transform: [{ translateX: slideAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepTitle} accessibilityRole="header">
                {currentStep.title}
              </Text>
              {currentStep.description ? (
                <Text style={styles.stepDescription}>{currentStep.description}</Text>
              ) : null}

              <View style={styles.fieldsContainer}>
                {currentStep.fields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    stepId={currentStep.id}
                    fieldValues={fieldValues}
                    errors={errors}
                    tokens={tokens}
                    styles={styles}
                    onFieldChange={handleFieldChange}
                    wizardId={config.id}
                  />
                ))}
              </View>
            </ScrollView>
          </Animated.View>

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
            {/* Cancel — only on first step when onCancel is provided */}
            {isFirstStep && config.onCancel ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonGhost]}
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel={config.cancelLabel ?? 'Cancel'}
                testID={`wizard-${config.id}-cancel`}
              >
                <Text style={[styles.buttonText, styles.buttonTextGhost]}>
                  {config.cancelLabel ?? 'Cancel'}
                </Text>
              </TouchableOpacity>
            ) : (
              // Spacer to keep Next button right-aligned when Cancel is absent
              <View style={styles.buttonSpacer} />
            )}

            <View style={styles.buttonRight}>
              {/* Back — hidden on first step */}
              {!isFirstStep ? (
                <TouchableOpacity
                  style={[styles.button, styles.buttonOutline]}
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel={config.backLabel ?? 'Back'}
                  testID={`wizard-${config.id}-back`}
                >
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>
                    {config.backLabel ?? 'Back'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Next / Submit */}
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, submitting ? styles.buttonDisabled : null]}
                onPress={handleNext}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={
                  isLastStep ? (config.submitLabel ?? 'Submit') : (config.nextLabel ?? 'Next')
                }
                accessibilityState={{ busy: submitting }}
                testID={`wizard-${config.id}-${isLastStep ? 'submit' : 'next'}`}
              >
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {isLastStep ? (config.submitLabel ?? 'Submit') : (config.nextLabel ?? 'Next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ComponentWrapper>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },

    // Header
    header: {
      paddingHorizontal: tokens.spacing[4],
      paddingTop: tokens.spacing[4],
      paddingBottom: tokens.spacing[2],
    },
    wizardTitle: {
      fontSize: tokens.typography.fontSizeXl,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.text,
    },

    // Progress
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.divider,
    },
    progressDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[1],
      flex: 1,
    },
    progressDot: {
      width: 10,
      height: 10,
      borderRadius: tokens.radius.full,
      borderWidth: 2,
    },
    progressDotCompleted: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    progressDotCurrent: {
      backgroundColor: 'transparent',
      borderColor: tokens.colors.primary,
    },
    progressDotUpcoming: {
      backgroundColor: 'transparent',
      borderColor: tokens.colors.border,
    },
    progressText: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
    },

    // Step content
    stepContent: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing[4],
      paddingBottom: tokens.spacing[6],
    },
    stepTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    stepDescription: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      marginBottom: tokens.spacing[4],
      lineHeight:
        tokens.typography.fontSizeSm * tokens.typography.lineHeightNormal,
    },

    // Fields
    fieldsContainer: {
      gap: tokens.spacing[4],
    },
    fieldContainer: {
      gap: tokens.spacing[1],
    },
    fieldLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightMedium,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[1],
    },
    required: {
      color: tokens.colors.error,
    },
    fieldInput: {
      backgroundColor: tokens.colors.inputBackground,
      borderColor: tokens.colors.inputBorder,
      borderWidth: 1,
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[3],
      paddingVertical: tokens.spacing[3],
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
      minHeight: 48,
    },
    fieldInputError: {
      borderColor: tokens.colors.error,
    },
    textareaInput: {
      height: 100,
      paddingTop: tokens.spacing[3],
    },
    fieldError: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.error,
      marginTop: tokens.spacing[1],
    },
    fieldHelper: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },

    // Checkbox field
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[3],
    },
    checkboxBox: {
      width: 22,
      height: 22,
      borderRadius: tokens.radius.sm,
      borderWidth: 2,
      borderColor: tokens.colors.inputBorder,
      backgroundColor: tokens.colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxBoxChecked: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    checkboxMark: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.primaryForeground,
      fontWeight: tokens.typography.fontWeightBold,
      lineHeight: 16,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },

    // Select trigger
    selectTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectTriggerText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.inputText,
    },
    selectPlaceholder: {
      color: tokens.colors.inputPlaceholder,
    },
    chevron: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginLeft: tokens.spacing[2],
    },

    // Navigation buttons
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[4],
      borderTopWidth: 1,
      borderTopColor: tokens.colors.divider,
      backgroundColor: tokens.colors.surface,
      ...tokens.shadows.sm,
    },
    buttonSpacer: {
      flex: 1,
    },
    buttonRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing[2],
    },
    button: {
      borderRadius: tokens.radius.md,
      paddingHorizontal: tokens.spacing[4],
      paddingVertical: tokens.spacing[3],
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: tokens.colors.primary,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    buttonGhost: {
      backgroundColor: 'transparent',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    buttonTextPrimary: {
      color: tokens.colors.primaryForeground,
    },
    buttonTextOutline: {
      color: tokens.colors.text,
    },
    buttonTextGhost: {
      color: tokens.colors.textMuted,
    },
  })
}

function makeSelectModalStyles(tokens: DesignTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: tokens.colors.overlay + 'CC',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: tokens.colors.surface,
      borderTopLeftRadius: tokens.radius.xl,
      borderTopRightRadius: tokens.radius.xl,
      maxHeight: '60%',
      ...Platform.select({
        android: { paddingBottom: tokens.spacing[4] },
      }),
    },
    sheetInner: {
      padding: tokens.spacing[4],
    },
    sheetTitle: {
      fontSize: tokens.typography.fontSizeLg,
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.text,
      marginBottom: tokens.spacing[3],
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[2],
      borderRadius: tokens.radius.md,
    },
    optionSelected: {
      backgroundColor: tokens.colors.surfaceAlt,
    },
    optionText: {
      flex: 1,
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.text,
    },
    optionTextSelected: {
      fontWeight: tokens.typography.fontWeightSemibold,
      color: tokens.colors.primary,
    },
    checkmark: {
      fontSize: tokens.typography.fontSizeMd,
      color: tokens.colors.primary,
      marginLeft: tokens.spacing[2],
    },
  })
}
