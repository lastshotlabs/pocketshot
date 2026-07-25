import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { CalendarBase, type CalendarBaseEvent } from './standalone'
import type { CalendarConfig, CalendarEvent } from './types'
import { CalendarSchema } from './schema'

export function Calendar({ config: inputConfig }: { config: CalendarConfig }) {
  const config = CalendarSchema.parse(inputConfig)
  const { values, setValue, dispatch } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? (resolveFromRef(config.value as { from: string }, values) as unknown as string | null)
    : ((config.value as string | undefined) ?? null)

  const resolvedEvents: CalendarBaseEvent[] = useMemo(() => {
    if (!config.events) return []
    if (isFromRef(config.events)) {
      const ref = resolveFromRef(config.events, values)
      return Array.isArray(ref) ? (ref as CalendarBaseEvent[]) : []
    }
    return config.events as CalendarEvent[] as CalendarBaseEvent[]
  }, [config.events, values])

  const handleDateChange = useCallback(
    async (dateStr: string) => {
      if (config.id) setValue(config.id, dateStr)
      if (config.onDatePress) await dispatch(config.onDatePress)
    },
    [config.id, config.onDatePress, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <CalendarBase
        id={config.id}
        testID={config.testID}
        selectedDate={resolvedValue}
        defaultDate={config.defaultValue}
        events={resolvedEvents}
        showNavigation={config.showNavigation}
        onDateChange={handleDateChange}
      />
    </ComponentWrapper>
  )
}
