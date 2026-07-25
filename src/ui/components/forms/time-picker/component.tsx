import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { TimePickerBase } from './standalone'
import type { TimePickerConfig } from './types'

export function TimePicker({ config }: { config: TimePickerConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedDefault =
    config.defaultValue != null ? resolveFromRef<string>(config.defaultValue, values) : undefined
  const resolvedLabel =
    config.label != null ? resolveFromRef<string>(config.label, values) : undefined
  const resolvedPlaceholder =
    config.placeholder != null ? resolveFromRef<string>(config.placeholder, values) : undefined

  const handleChange = useCallback(
    (next: string) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TimePickerBase
        id={config.id}
        defaultValue={resolvedDefault}
        onChange={handleChange}
        label={resolvedLabel}
        placeholder={resolvedPlaceholder}
        is24Hour={config.is24Hour}
        minuteInterval={config.minuteInterval}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
