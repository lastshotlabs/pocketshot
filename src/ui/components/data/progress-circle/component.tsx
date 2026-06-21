import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { ProgressCircleBase, type ProgressCircleSize } from './standalone'
import type { ProgressCircleConfig } from './types'

export function ProgressCircle({ config }: { config: ProgressCircleConfig }) {
  const { values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? Number(resolveFromRef(config.value, values) ?? 0)
    : config.value
  const resolvedLabel =
    config.label == null
      ? undefined
      : isFromRef(config.label)
        ? String(resolveFromRef(config.label, values) ?? '')
        : config.label

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      style={{ alignItems: 'center' }}
    >
      <ProgressCircleBase
        value={resolvedValue}
        label={resolvedLabel}
        size={(config.size ?? 'md') as ProgressCircleSize}
        strokeWidth={config.strokeWidth}
        trackColor={config.trackColor}
        showValue={config.showValue !== false}
        animated={config.animated !== false}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
