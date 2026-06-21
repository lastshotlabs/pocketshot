import React, { useCallback, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import { DataListBase } from './standalone'
import type { DataListConfig } from './types'

export function DataList({ config }: { config: DataListConfig }) {
  const { dispatch, setValue } = useScreenContext()
  const { data, isLoading, error } = useComponentData<unknown[]>(config.data)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh', target: config.id ?? 'screen' })
    setRefreshing(false)
  }, [config.id, config.refreshable, dispatch])

  const handleItemPress = useCallback(
    async (item: unknown) => {
      if (!config.onItemPress) return
      setValue('__pressedItem', item)
      await dispatch(config.onItemPress)
    },
    [config.onItemPress, dispatch, setValue],
  )

  const items = Array.isArray(data) ? data : []

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <DataListBase
        items={items}
        itemType={config.itemType}
        keyExtractor={config.keyExtractor ?? 'id'}
        numColumns={config.numColumns}
        refreshable={config.refreshable}
        refreshing={refreshing}
        onRefresh={config.refreshable ? handleRefresh : undefined}
        onItemPress={config.onItemPress ? (item) => void handleItemPress(item) : undefined}
        loading={isLoading && !data}
        loadingCount={config.loadingCount ?? 3}
        error={Boolean(error)}
        emptyMessage={config.emptyMessage ?? 'Nothing here yet'}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
