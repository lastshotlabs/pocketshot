import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { WizardBase, type WizardFieldValues, type WizardStepDefinition } from './standalone'
import type { WizardConfig } from './types'

export function Wizard({ config }: { config: WizardConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedTitle =
    config.title != null ? resolveFromRef<string>(config.title, values) : undefined
  const resolvedNextLabel =
    config.nextLabel != null ? resolveFromRef<string>(config.nextLabel, values) : undefined
  const resolvedBackLabel =
    config.backLabel != null ? resolveFromRef<string>(config.backLabel, values) : undefined
  const resolvedSubmitLabel =
    config.submitLabel != null ? resolveFromRef<string>(config.submitLabel, values) : undefined
  const resolvedCancelLabel =
    config.cancelLabel != null ? resolveFromRef<string>(config.cancelLabel, values) : undefined

  const handleStepChange = useCallback(
    (stepIndex: number) => {
      setValue(`${config.id}_step`, stepIndex)
    },
    [config.id, setValue],
  )

  const handleComplete = useCallback(
    (formValues: WizardFieldValues) => {
      setValue(config.id, formValues)
      if (config.onComplete) void dispatch(config.onComplete)
    },
    [config.id, config.onComplete, dispatch, setValue],
  )

  const handleCancel = useCallback(() => {
    if (config.onCancel) void dispatch(config.onCancel)
  }, [config.onCancel, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <WizardBase
        id={config.id}
        steps={config.steps as WizardStepDefinition[]}
        title={resolvedTitle}
        showProgress={config.showProgress}
        nextLabel={resolvedNextLabel}
        backLabel={resolvedBackLabel}
        submitLabel={resolvedSubmitLabel}
        cancelLabel={resolvedCancelLabel}
        onComplete={handleComplete}
        onCancel={config.onCancel ? handleCancel : undefined}
        onStepChange={handleStepChange}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
