import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { SwitchBase } from './standalone'
import type { SwitchConfig } from './types'

export function Switch({ config }: { config: SwitchConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as boolean | undefined) : undefined

  const handleChange = useCallback(
    (next: boolean) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates = [
    ...(resolvedValue ? (['selected'] as const) : []),
    ...(config.disabled ? (['disabled'] as const) : []),
  ]

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <SwitchBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onValueChange={handleChange}
        label={config.label}
        disabled={config.disabled}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
