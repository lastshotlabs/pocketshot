import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { StatusBadgeBase, type StatusBadgeSize } from './standalone'
import type { StatusBadgeConfig } from './types'

export function StatusBadge({ config }: { config: StatusBadgeConfig }) {
  const { values } = useScreenContext()

  const rawStatus = isFromRef(config.status)
    ? String(resolveFromRef(config.status, values) ?? 'unknown')
    : config.status

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <StatusBadgeBase
        id={config.id}
        testID={config.testID}
        status={rawStatus}
        statusMap={config.statusMap}
        size={(config.size ?? 'md') as StatusBadgeSize}
        showDot={config.showDot}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
