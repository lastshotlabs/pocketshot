import React from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { PriceDisplayBase, type PriceDisplaySize } from './standalone'
import type { PriceDisplayConfig } from './types'

export function PriceDisplay({ config }: { config: PriceDisplayConfig }) {
  const { values } = useScreenContext()

  const resolvedAmount = isFromRef(config.amount)
    ? (resolveFromRef(config.amount, values) as unknown as number | string)
    : config.amount
  const resolvedOriginal =
    config.originalAmount != null
      ? isFromRef(config.originalAmount)
        ? (resolveFromRef(config.originalAmount, values) as unknown as number)
        : config.originalAmount
      : undefined

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <PriceDisplayBase
        id={config.id}
        testID={config.testID}
        amount={resolvedAmount}
        originalAmount={resolvedOriginal}
        currency={config.currency}
        locale={config.locale}
        size={(config.size ?? 'md') as PriceDisplaySize}
        badge={config.badge}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
