import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TagSelectorBase } from './standalone'
import type { TagSelectorConfig } from './types'

export function TagSelector({ config }: { config: TagSelectorConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as string[] | undefined)
      : undefined

  const handleChange = useCallback(
    (next: string[]) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates: ('selected' | 'disabled')[] | undefined =
    (resolvedValue ?? config.defaultValue ?? []).length > 0 ? ['selected'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <TagSelectorBase
        id={config.id}
        availableTags={config.availableTags}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChange={handleChange}
        label={config.label}
        maxTags={config.maxTags}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
