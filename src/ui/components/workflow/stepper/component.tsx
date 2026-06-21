import React, { useCallback, useEffect } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { StepperBase, type StepperBaseStep, type StepperVariant } from './standalone'
import type { StepperConfig, StepItem } from './types'

export function Stepper({ config }: { config: StepperConfig }) {
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedCurrent =
    config.currentStep == null
      ? undefined
      : isFromRef(config.currentStep)
        ? String(resolveFromRef(config.currentStep, values) ?? '')
        : String(config.currentStep)

  // Compute active step id and publish to ScreenContext under config.id.
  const steps = config.steps as StepperBaseStep[]
  const activeIndex = (() => {
    if (resolvedCurrent == null) return 0
    const byId = steps.findIndex((s) => s.id === resolvedCurrent)
    if (byId !== -1) return byId
    const parsed = parseInt(resolvedCurrent, 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) return parsed
    return 0
  })()

  useEffect(() => {
    const activeStep = steps[activeIndex]
    if (activeStep) setValue(config.id, activeStep.id)
  }, [activeIndex, config.id, steps, setValue])

  const handleStepPress = useCallback(
    async (step: StepperBaseStep) => {
      if (!config.onStepPress) return
      setValue('__pressedStep', step.id)
      await dispatch(config.onStepPress)
    },
    [config.onStepPress, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <StepperBase
        id={config.id}
        testID={config.testID}
        steps={steps}
        currentStep={resolvedCurrent}
        variant={(config.variant ?? 'horizontal') as StepperVariant}
        onStepPress={config.onStepPress ? handleStepPress : undefined}
      />
    </ComponentWrapper>
  )
}

// Re-export for tests that import StepItem
export type { StepItem }
