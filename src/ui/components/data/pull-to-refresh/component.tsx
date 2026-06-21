import React, { useCallback, type ReactNode } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { PullToRefreshBase } from './standalone'
import type { PullToRefreshConfig } from './types'

export interface PullToRefreshProps {
  config: PullToRefreshConfig
  children?: ReactNode
}

export function PullToRefresh({ config, children }: PullToRefreshProps) {
  const { dispatch, values } = useScreenContext()

  const refreshing = isFromRef(config.refreshing)
    ? (resolveFromRef<boolean>(config.refreshing, values) ?? false)
    : Boolean(config.refreshing)

  const handleRefresh = useCallback(async () => {
    await dispatch(config.onRefresh)
  }, [config.onRefresh, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PullToRefreshBase
        refreshing={refreshing}
        onRefresh={handleRefresh}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      >
        {children}
      </PullToRefreshBase>
    </ComponentWrapper>
  )
}
