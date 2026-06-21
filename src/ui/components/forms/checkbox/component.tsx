import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { CheckboxBase } from './standalone'
import type { CheckboxConfig } from './types'

export function Checkbox({ config }: { config: CheckboxConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedChecked =
    config.checked != null ? (resolveFromRef(config.checked, values) as boolean | undefined) : undefined

  const handleChange = useCallback(
    (next: boolean) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates = [
    ...(resolvedChecked ? (['selected'] as const) : []),
    ...(config.disabled ? (['disabled'] as const) : []),
  ]

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} activeStates={activeStates}>
      <CheckboxBase
        id={config.id}
        checked={resolvedChecked}
        defaultChecked={config.defaultChecked}
        onCheckedChange={handleChange}
        label={config.label}
        disabled={config.disabled}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
