import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { SliderBase } from './standalone'
import type { SliderConfig } from './types'

export function Slider({ config }: { config: SliderConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as number | undefined) : undefined

  const handleValueChange = useCallback(
    (next: number) => {
      setValue(config.id, next)
    },
    [config.id, setValue],
  )

  const handleSlidingComplete = useCallback(
    (next: number) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <SliderBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        label={config.label}
        showValue={config.showValue}
        min={config.min}
        max={config.max}
        step={config.step}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
