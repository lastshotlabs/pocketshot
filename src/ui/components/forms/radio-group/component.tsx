import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { RadioGroupBase, type RadioGroupOption } from './standalone'
import type { RadioGroupConfig } from './types'

export function RadioGroup({ config }: { config: RadioGroupConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions =
    (resolveFromRef(config.options, values) as RadioGroupOption[] | undefined) ?? []
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined

  const handleChange = useCallback(
    (next: string) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates: ('selected' | 'disabled')[] | undefined =
    (resolvedValue ?? config.defaultValue) != null ? ['selected'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <RadioGroupBase
        id={config.id}
        options={resolvedOptions}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChange={handleChange}
        label={config.label}
        orientation={config.orientation}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
