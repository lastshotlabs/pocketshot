import React, { useCallback, useMemo, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { useComponentData } from '../../_base/useComponentData'
import { FeedBase, type FeedBaseItem } from './standalone'
import type { FeedConfig, FeedItem } from './types'
import { FeedSchema } from './schema'

export function Feed({ config: inputConfig }: { config: FeedConfig }) {
  const config = FeedSchema.parse(inputConfig)
  const { dispatch, setValue, values } = useScreenContext()

  const dataSpec = isFromRef(config.data) ? config.data : (config.data as string)
  const { data: rawData, isLoading } = useComponentData<FeedItem[]>(dataSpec)

  const resolvedData = useMemo<FeedBaseItem[]>(() => {
    if (isFromRef(config.data)) {
      const ref = resolveFromRef(config.data, values)
      return Array.isArray(ref) ? (ref as FeedBaseItem[]) : []
    }
    return Array.isArray(rawData) ? (rawData as FeedBaseItem[]) : []
  }, [config.data, rawData, values])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await dispatch({ type: 'refresh', target: config.id ?? 'screen' })
    } finally {
      setRefreshing(false)
    }
  }, [config.id, dispatch])

  const handleLoadMore = useCallback(() => {
    if (!config.onEndReached) return
    void dispatch(config.onEndReached)
  }, [config.onEndReached, dispatch])

  const handleItemPress = useCallback(
    (item: FeedBaseItem) => {
      setValue('__pressedFeedItem', item)
      if (config.onItemPress) void dispatch(config.onItemPress)
    },
    [config.onItemPress, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config} style={{ flex: 1 }}>
      <FeedBase
        id={config.id}
        testID={config.testID}
        items={resolvedData}
        showAvatars={config.showAvatars ?? true}
        loading={isLoading}
        loadingCount={config.loadingCount}
        emptyMessage={config.emptyMessage}
        refreshable={config.refreshable}
        refreshing={refreshing}
        onRefresh={config.refreshable ? handleRefresh : undefined}
        onItemPress={config.onItemPress ? handleItemPress : undefined}
        onLoadMore={config.onEndReached ? handleLoadMore : undefined}
      />
    </ComponentWrapper>
  )
}
