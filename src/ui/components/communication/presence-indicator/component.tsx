import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { PresenceIndicatorBase, type PresenceStatus } from './standalone'
import type { PresenceIndicatorConfig } from './types'

export function PresenceIndicator({ config }: { config: PresenceIndicatorConfig }) {
  const { values } = useScreenContext()

  const status = resolveFromRef(config.status, values) as PresenceStatus

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PresenceIndicatorBase
        id={config.id}
        testID={config.testID}
        status={status}
        size={config.size}
        showLabel={config.showLabel}
        label={config.label}
        bordered={config.bordered}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
