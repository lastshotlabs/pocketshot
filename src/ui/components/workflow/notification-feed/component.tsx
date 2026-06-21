import React, { useCallback, useState } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { useComponentData } from '../../_base/useComponentData'
import { NotificationFeedBase, type NotificationFeedBaseItem } from './standalone'
import type { NotificationFeedConfig, Notification } from './types'

export function NotificationFeed({ config }: { config: NotificationFeedConfig }) {
  const { setValue, dispatch } = useScreenContext()

  const { data: fetchedData, isLoading } = useComponentData<Notification[]>(config.data)
  const [refreshing, setRefreshing] = useState(false)

  const notifications: NotificationFeedBaseItem[] = Array.isArray(fetchedData)
    ? (fetchedData as NotificationFeedBaseItem[])
    : []

  const handleMarkAllRead = useCallback(() => {
    if (config.onMarkAllRead) void dispatch(config.onMarkAllRead)
  }, [config.onMarkAllRead, dispatch])

  const handleItemPress = useCallback(
    (notification: NotificationFeedBaseItem) => {
      setValue('__pressedNotification', notification)
      if (config.onItemPress) void dispatch(config.onItemPress)
    },
    [config.onItemPress, dispatch, setValue],
  )

  const handleRefresh = useCallback(async () => {
    if (!config.refreshable) return
    setRefreshing(true)
    await dispatch({ type: 'refresh', target: config.id ?? 'screen' })
    setRefreshing(false)
  }, [config.id, config.refreshable, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <NotificationFeedBase
        id={config.id}
        testID={config.testID}
        notifications={notifications}
        showMarkAllRead={config.showMarkAllRead}
        refreshable={config.refreshable}
        refreshing={refreshing}
        loading={isLoading}
        emptyMessage={config.emptyMessage}
        onItemPress={config.onItemPress ? handleItemPress : undefined}
        onMarkAllRead={config.onMarkAllRead ? handleMarkAllRead : undefined}
        onRefresh={config.refreshable ? handleRefresh : undefined}
      />
    </ComponentWrapper>
  )
}
