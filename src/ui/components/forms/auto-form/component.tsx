import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { AutoFormBase, type AutoFormFieldDefinition } from './standalone'
import type { AutoFormConfig } from './types'

export function AutoForm({ config }: { config: AutoFormConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const validationErrors =
    config.validationErrors != null
      ? (resolveFromRef(config.validationErrors, values) as Record<string, string> | undefined)
      : undefined

  const handleSubmit = useCallback(
    async (formValues: Record<string, unknown>) => {
      setValue(config.onSubmitKey ?? '__formData', formValues)
      await dispatch(config.onSubmit)
    },
    [config.onSubmitKey, config.onSubmit, setValue, dispatch],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AutoFormBase
        id={config.id}
        fields={config.fields as AutoFormFieldDefinition[]}
        submitLabel={config.submitLabel}
        onSubmit={(formValues) => void handleSubmit(formValues)}
        validationErrors={validationErrors}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
