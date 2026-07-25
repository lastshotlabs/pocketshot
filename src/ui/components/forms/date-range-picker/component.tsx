import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { DateRangePickerBase } from './standalone'
import type { DateRangePickerConfig } from './types'
import { DateRangePickerSchema } from './schema'

export function DateRangePicker({ config: inputConfig }: { config: DateRangePickerConfig }) {
  const config = DateRangePickerSchema.parse(inputConfig)
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedStart =
    config.defaultStart != null ? resolveFromRef<string>(config.defaultStart, values) : undefined
  const resolvedEnd =
    config.defaultEnd != null ? resolveFromRef<string>(config.defaultEnd, values) : undefined

  const handleChange = useCallback(
    (range: { start: string | null; end: string | null }) => {
      setValue(config.id, { start: range.start ?? '', end: range.end ?? '' })
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <DateRangePickerBase
        id={config.id}
        defaultStart={resolvedStart}
        defaultEnd={resolvedEnd}
        onChange={handleChange}
        label={config.label}
        startPlaceholder={config.startPlaceholder}
        endPlaceholder={config.endPlaceholder}
        format={config.format}
        minDate={config.minDate}
        maxDate={config.maxDate}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
