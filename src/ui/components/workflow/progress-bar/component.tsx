import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { ProgressBarBase, type ProgressBarVariant } from './standalone'
import type { ProgressBarConfig } from './types'

export function ProgressBar({ config }: { config: ProgressBarConfig }) {
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
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <ProgressBarBase
        id={config.id}
        testID={config.testID}
        value={resolvedValue}
        variant={(config.variant ?? 'default') as ProgressBarVariant}
        label={resolvedLabel}
        showValue={config.showValue}
        animated={config.animated}
        height={config.height as string | number | undefined}
        borderRadius={config.borderRadius as string | number | undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
