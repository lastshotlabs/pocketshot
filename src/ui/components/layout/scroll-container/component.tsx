import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { ScrollContainerBase } from './standalone'
import type { ScrollContainerConfig } from './types'

export function ScrollContainer({
  config,
  children,
}: {
  config: ScrollContainerConfig
  children?: React.ReactNode
}) {
  const { dispatch } = useScreenContext()

  const handleRefresh = useCallback(async () => {
    if (!config.onRefresh) return
    await dispatch(config.onRefresh)
  }, [config.onRefresh, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ScrollContainerBase
        horizontal={config.horizontal}
        showsScrollIndicator={config.showsScrollIndicator}
        contentPadding={config.contentPadding as string | number | undefined}
        refreshable={config.refreshable}
        onRefresh={config.onRefresh ? handleRefresh : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </ScrollContainerBase>
    </ComponentWrapper>
  )
}
