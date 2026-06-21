import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { RatingInputBase } from './standalone'
import type { RatingInputConfig } from './types'

export function RatingInput({ config }: { config: RatingInputConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as number | undefined)
      : undefined

  const handleChange = useCallback(
    (next: number) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const activeStates: ('selected' | 'disabled')[] | undefined =
    (resolvedValue ?? config.defaultValue ?? 0) > 0 ? ['selected'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <RatingInputBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChange={handleChange}
        label={config.label}
        maxStars={config.maxStars}
        size={config.size}
        allowHalf={config.allowHalf}
        readOnly={config.readOnly}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
