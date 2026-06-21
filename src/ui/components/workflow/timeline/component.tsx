import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import { TimelineBase, type TimelineBaseItem } from './standalone'
import type { TimelineConfig, TimelineItem } from './types'

export function Timeline({ config }: { config: TimelineConfig }) {
  const { setValue, dispatch } = useScreenContext()
  const { data: fetchedItems, isLoading } = useComponentData<TimelineItem[]>(config.data)

  const staticItems = (config.items ?? []) as TimelineBaseItem[]
  const remoteItems = Array.isArray(fetchedItems) ? (fetchedItems as TimelineBaseItem[]) : []
  const allItems = [...staticItems, ...remoteItems]

  const handleItemPress = useCallback(
    async (item: TimelineBaseItem) => {
      if (config.id) setValue(config.id, item)
      const onItemPress = (config as { onItemPress?: unknown }).onItemPress
      if (onItemPress) await dispatch(onItemPress as Parameters<typeof dispatch>[0])
    },
    [config, dispatch, setValue],
  )

  const hasOnItemPress = (config as { onItemPress?: unknown }).onItemPress != null

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TimelineBase
        id={config.id}
        testID={config.testID}
        items={allItems}
        loading={isLoading}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        onItemPress={hasOnItemPress ? handleItemPress : undefined}
      />
    </ComponentWrapper>
  )
}
