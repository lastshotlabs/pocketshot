import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { NotificationItemBase } from './standalone'
import type { NotificationItemConfig } from './types'

export function NotificationItem({ config }: { config: NotificationItemConfig }) {
  const { values, dispatch } = useScreenContext()

  const title = resolveFromRef(config.title, values) as string
  const body =
    config.body != null ? (resolveFromRef(config.body, values) as string | undefined) : undefined
  const timestamp =
    config.timestamp != null
      ? (resolveFromRef(config.timestamp, values) as string | undefined)
      : undefined
  const read = config.read != null ? (resolveFromRef(config.read, values) as boolean) : false

  const handlePress = useCallback(() => {
    if (config.onPress) void dispatch(config.onPress)
  }, [config.onPress, dispatch])

  const handleDismiss = useCallback(() => {
    if (config.onDismiss) void dispatch(config.onDismiss)
  }, [config.onDismiss, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <NotificationItemBase
        id={config.id}
        testID={config.testID}
        title={title}
        body={body}
        timestamp={timestamp}
        read={read}
        icon={config.icon}
        onPress={config.onPress ? handlePress : undefined}
        onDismiss={config.onDismiss ? handleDismiss : undefined}
      />
    </ComponentWrapper>
  )
}
