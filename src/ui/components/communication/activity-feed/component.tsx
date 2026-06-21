import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useComponentData } from '../../_base/useComponentData'
import { ActivityFeedBase, type ActivityFeedBaseItem } from './standalone'
import type { ActivityFeedConfig, ActivityFeedItem } from './types'

export function ActivityFeed({ config }: { config: ActivityFeedConfig }) {
  const { data, isLoading, error } = useComponentData<ActivityFeedItem[]>(config.data)

  const items = (Array.isArray(data) ? data : []) as ActivityFeedBaseItem[]

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ActivityFeedBase
        id={config.id}
        testID={config.testID}
        items={items}
        loading={isLoading}
        error={error != null}
        emptyMessage={config.emptyMessage}
        itemHeight={config.itemHeight}
      />
    </ComponentWrapper>
  )
}
