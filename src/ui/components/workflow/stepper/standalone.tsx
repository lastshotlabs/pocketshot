import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import { useTokens } from '../../../context/AppContext'
import type { DesignTokens } from '../../../tokens/types'

export type StepperVariant = 'horizontal' | 'vertical'
export type StepState = 'completed' | 'active' | 'upcoming'

export interface StepperBaseStep {
  id: string
  label: string
  description?: string
}

export interface StepperBaseProps {
  /** Step definitions. */
  steps: StepperBaseStep[]
  /** Active step — supports id or zero-based index as string. */
  currentStep?: string | number
  /** Layout variant. */
  variant?: StepperVariant
  /** Called with the step that was pressed. If undefined, steps are not interactive. */
  onStepPress?: (step: StepperBaseStep) => void
  style?: ViewStyle
  testID?: string
  id?: string
}

function getStepState(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return 'completed'
  if (index === activeIndex) return 'active'
  return 'upcoming'
}

function resolveActiveIndex(
  steps: StepperBaseStep[],
  currentStep: string | number | undefined,
): number {
  if (currentStep == null) return 0
  const resolved = String(currentStep)
  const byId = steps.findIndex((s) => s.id === resolved)
  if (byId !== -1) return byId
  const parsed = parseInt(resolved, 10)
  if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) return parsed
  return 0
}

/**
 * Standalone Stepper — plain React props, no manifest required.
 *
 * @example
 * <StepperBase steps={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} currentStep="a" />
 */
export function StepperBase({
  steps,
  currentStep,
  variant = 'horizontal',
  onStepPress,
  style,
  testID,
  id,
}: StepperBaseProps) {
  const tokens = useTokens()
  const styles = makeStyles(tokens)
  const activeIndex = resolveActiveIndex(steps, currentStep)

  const containerStyle =
    variant === 'vertical' ? styles.verticalContainer : styles.horizontalContainer

  return (
    <View
      style={[containerStyle, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.max(steps.length - 1, 0), now: activeIndex }}
      accessibilityLabel="Step progress"
      testID={testID ?? id}
    >
      {steps.map((step, index) => {
        const state = getStepState(index, activeIndex)
        const isLast = index === steps.length - 1
        const handlePress = onStepPress ? () => onStepPress(step) : undefined
        if (variant === 'vertical') {
          return (
            <VerticalStepItem
              key={step.id}
              step={step}
              index={index}
              state={state}
              isLast={isLast}
              tokens={tokens}
              styles={styles}
              onPress={handlePress}
            />
          )
        }
        return (
          <HorizontalStepItem
            key={step.id}
            step={step}
            index={index}
            state={state}
            isLast={isLast}
            tokens={tokens}
            styles={styles}
            onPress={handlePress}
          />
        )
      })}
    </View>
  )
}

interface StepItemProps {
  step: StepperBaseStep
  index: number
  state: StepState
  isLast: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onPress?: () => void
}

function HorizontalStepItem({
  step,
  index,
  state,
  isLast,
  tokens,
  styles,
  onPress,
}: StepItemProps) {
  const circleStyle = [
    styles.circle,
    state === 'completed' && styles.circleCompleted,
    state === 'active' && styles.circleActive,
    state === 'upcoming' && styles.circleUpcoming,
  ]

  const circleContent =
    state === 'completed' ? (
      <Text style={styles.circleLabelCompleted}>✓</Text>
    ) : (
      <Text
        style={[
          styles.circleLabel,
          state === 'active' && styles.circleLabelActive,
          state === 'upcoming' && styles.circleLabelUpcoming,
        ]}
      >
        {index + 1}
      </Text>
    )

  const circle = (
    <View style={styles.horizontalStepRow}>
      <View style={circleStyle}>{circleContent}</View>
      <Text
        style={[styles.stepLabel, state === 'active' && styles.stepLabelActive]}
        numberOfLines={1}
      >
        {step.label}
      </Text>
    </View>
  )

  return (
    <View style={styles.horizontalItem}>
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Step ${index + 1}: ${step.label}`}
          accessibilityState={{ selected: state === 'active' }}
        >
          {circle}
        </TouchableOpacity>
      ) : (
        circle
      )}
      {!isLast ? (
        <View
          style={[
            styles.horizontalConnector,
            state === 'completed' && { backgroundColor: tokens.colors.primary },
          ]}
        />
      ) : null}
    </View>
  )
}

function VerticalStepItem({ step, index, state, isLast, tokens, styles, onPress }: StepItemProps) {
  const circleStyle = [
    styles.circle,
    state === 'completed' && styles.circleCompleted,
    state === 'active' && styles.circleActive,
    state === 'upcoming' && styles.circleUpcoming,
  ]

  const circleContent =
    state === 'completed' ? (
      <Text style={styles.circleLabelCompleted}>✓</Text>
    ) : (
      <Text
        style={[
          styles.circleLabel,
          state === 'active' && styles.circleLabelActive,
          state === 'upcoming' && styles.circleLabelUpcoming,
        ]}
      >
        {index + 1}
      </Text>
    )

  const content = (
    <View style={styles.verticalItem}>
      <View style={styles.verticalLeft}>
        <View style={circleStyle}>{circleContent}</View>
        {!isLast ? (
          <View
            style={[
              styles.verticalConnector,
              state === 'completed' && { backgroundColor: tokens.colors.primary },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.verticalContent}>
        <Text style={[styles.stepLabel, state === 'active' && styles.stepLabelActive]}>
          {step.label}
        </Text>
        {step.description != null ? (
          <Text style={styles.stepDescription}>{step.description}</Text>
        ) : null}
      </View>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Step ${index + 1}: ${step.label}`}
        accessibilityState={{ selected: state === 'active' }}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

function makeStyles(tokens: DesignTokens) {
  const CIRCLE_SIZE = 28

  return StyleSheet.create({
    horizontalContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    horizontalItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    horizontalStepRow: {
      alignItems: 'center',
      gap: tokens.spacing[1],
    },
    horizontalConnector: {
      flex: 1,
      height: 2,
      backgroundColor: tokens.colors.border,
      marginHorizontal: tokens.spacing[1],
    },
    verticalContainer: {
      flexDirection: 'column',
    },
    verticalItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    verticalLeft: {
      alignItems: 'center',
      marginRight: tokens.spacing[3],
    },
    verticalConnector: {
      width: 2,
      flex: 1,
      minHeight: tokens.spacing[6],
      backgroundColor: tokens.colors.border,
      marginTop: tokens.spacing[1],
    },
    verticalContent: {
      flex: 1,
      paddingBottom: tokens.spacing[4],
    },
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    circleCompleted: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    circleActive: {
      backgroundColor: 'transparent',
      borderColor: tokens.colors.primary,
    },
    circleUpcoming: {
      backgroundColor: 'transparent',
      borderColor: tokens.colors.border,
    },
    circleLabel: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    circleLabelCompleted: {
      fontSize: tokens.typography.fontSizeSm,
      fontWeight: tokens.typography.fontWeightBold,
      color: tokens.colors.primaryForeground,
    },
    circleLabelActive: {
      color: tokens.colors.primary,
    },
    circleLabelUpcoming: {
      color: tokens.colors.textMuted,
    },
    stepLabel: {
      fontSize: tokens.typography.fontSizeSm,
      color: tokens.colors.textMuted,
      fontWeight: tokens.typography.fontWeightMedium,
      textAlign: 'center',
    },
    stepLabelActive: {
      color: tokens.colors.text,
      fontWeight: tokens.typography.fontWeightSemibold,
    },
    stepDescription: {
      fontSize: tokens.typography.fontSizeXs,
      color: tokens.colors.textMuted,
      marginTop: tokens.spacing[1],
    },
  })
}
