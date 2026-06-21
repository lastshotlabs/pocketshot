import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { TooltipBase, type TooltipPosition } from './standalone'
import type { TooltipConfig } from './types'

export function Tooltip({ config }: { config: TooltipConfig }) {
  const { values } = useScreenContext()

  const resolvedTrigger = isFromRef(config.trigger)
    ? String(resolveFromRef(config.trigger, values) ?? '')
    : config.trigger
  const resolvedContent = isFromRef(config.content)
    ? String(resolveFromRef(config.content, values) ?? '')
    : config.content

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <TooltipBase
        trigger={resolvedTrigger}
        content={resolvedContent}
        position={(config.position ?? 'top') as TooltipPosition}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
