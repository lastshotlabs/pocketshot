import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { FormFieldBase } from './standalone'
import type { FormFieldConfig } from './types'

export function FormField({
  config,
  children,
}: {
  config: FormFieldConfig
  children?: React.ReactNode
}) {
  const { getValue, values } = useScreenContext()

  const label =
    config.label != null ? String(resolveFromRef(config.label, values) ?? '') : undefined
  const helperText =
    config.helperText != null ? String(resolveFromRef(config.helperText, values) ?? '') : undefined
  const errorText =
    config.errorKey != null ? (getValue(config.errorKey) as string | undefined) : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FormFieldBase
        id={config.id}
        label={label}
        required={config.required}
        helperText={helperText}
        errorText={errorText}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      >
        {children}
      </FormFieldBase>
    </ComponentWrapper>
  )
}
