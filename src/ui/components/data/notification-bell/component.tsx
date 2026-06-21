import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { NotificationBellBase } from './standalone'
import type { NotificationBellConfig } from './types'

export function NotificationBell({ config }: { config: NotificationBellConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedCount = useMemo<number>(() => {
    if (config.count === undefined) return 0
    if (isFromRef(config.count)) {
      const val = resolveFromRef(config.count, values)
      return typeof val === 'number' ? Math.max(0, Math.floor(val)) : 0
    }
    return config.count
  }, [config.count, values])

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <NotificationBellBase
        count={resolvedCount}
        maxCount={config.maxCount ?? 99}
        animated={config.animated}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
