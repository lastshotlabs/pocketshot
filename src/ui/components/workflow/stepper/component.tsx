import React, { useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useTokens } from '../../../context/AppContext'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import type { DesignTokens } from '../../../tokens/types'
import type { StepperConfig, StepItem, StepState } from './types'

function getStepState(
  step: StepItem,
  index: number,
  activeIndex: number,
): StepState {
  if (index < activeIndex) return 'completed'
  if (index === activeIndex) return 'active'
  return 'upcoming'
}

function resolveActiveIndex(
  steps: StepItem[],
  currentStep: string | { from: string } | undefined,
  values: Record<string, unknown>,
): number {
  if (currentStep == null) return 0

  const resolved = isFromRef(currentStep)
    ? String(resolveFromRef(currentStep, values) ?? '')
    : currentStep

  // Try to match by step id
  const byId = steps.findIndex((s) => s.id === resolved)
  if (byId !== -1) return byId

  // Try to parse as index
  const parsed = parseInt(resolved, 10)
  if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) return parsed

  return 0
}

export function Stepper({ config }: { config: StepperConfig }) {
  const tokens = useTokens()
  const { values, setValue, dispatch } = useScreenContext()

  const activeIndex = resolveActiveIndex(config.steps, config.currentStep, values)

  // Publish active step to ScreenContext under config.id
  useEffect(() => {
    const activeStep = config.steps[activeIndex]
    if (activeStep) {
      setValue(config.id, activeStep.id)
    }
  }, [activeIndex, config.id, config.steps, setValue])

  const handleStepPress = useCallback(
    async (step: StepItem) => {
      if (!config.onStepPress) return
      setValue('__pressedStep', step.id)
      await dispatch(config.onStepPress)
    },
    [config.onStepPress, dispatch, setValue],
  )

  const styles = makeStyles(tokens)

  if (config.variant === 'vertical') {
    return (
      <ComponentWrapper id={config.id} testID={config.testID}>
        <View
          style={styles.verticalContainer}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: config.steps.length - 1, now: activeIndex }}
          accessibilityLabel="Step progress"
        >
          {config.steps.map((step, index) => {
            const state = getStepState(step, index, activeIndex)
            const isLast = index === config.steps.length - 1
            return (
              <VerticalStepItem
                key={step.id}
                step={step}
                index={index}
                state={state}
                isLast={isLast}
                tokens={tokens}
                styles={styles}
                onPress={config.onStepPress ? () => handleStepPress(step) : undefined}
              />
            )
          })}
        </View>
      </ComponentWrapper>
    )
  }

  return (
    <ComponentWrapper id={config.id} testID={config.testID}>
      <View
        style={styles.horizontalContainer}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: config.steps.length - 1, now: activeIndex }}
        accessibilityLabel="Step progress"
      >
        {config.steps.map((step, index) => {
          const state = getStepState(step, index, activeIndex)
          const isLast = index === config.steps.length - 1
          return (
            <HorizontalStepItem
              key={step.id}
              step={step}
              index={index}
              state={state}
              isLast={isLast}
              tokens={tokens}
              styles={styles}
              onPress={config.onStepPress ? () => handleStepPress(step) : undefined}
            />
          )
        })}
      </View>
    </ComponentWrapper>
  )
}

interface StepItemProps {
  step: StepItem
  index: number
  state: StepState
  isLast: boolean
  tokens: DesignTokens
  styles: ReturnType<typeof makeStyles>
  onPress?: () => void
}

function HorizontalStepItem({ step, index, state, isLast, tokens, styles, onPress }: StepItemProps) {
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
        style={[
          styles.stepLabel,
          state === 'active' && styles.stepLabelActive,
        ]}
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
        <Text
          style={[
            styles.stepLabel,
            state === 'active' && styles.stepLabelActive,
          ]}
        >
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
