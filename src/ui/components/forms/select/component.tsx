import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { SelectBase } from './standalone'
import type { SelectConfig, SelectOption } from './types'

export function Select({ config }: { config: SelectConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedOptions = resolveFromRef<SelectOption[]>(config.options, values) ?? []
  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined

  const handleChange = useCallback(
    (next: string) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates: ('selected' | 'open')[] | undefined =
    resolvedValue != null ? ['selected'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <SelectBase
        id={config.id}
        options={resolvedOptions}
        value={resolvedValue}
        onChange={handleChange}
        label={config.label}
        placeholder={config.placeholder}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
