import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { StatCardBase, type StatCardTrend } from './standalone'
import type { StatCardConfig } from './types'

export function StatCard({ config }: { config: StatCardConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedValue = isFromRef(config.value)
    ? String(resolveFromRef(config.value, values) ?? '')
    : String(config.value)

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <StatCardBase
        label={config.label}
        value={resolvedValue}
        icon={config.icon}
        trend={config.trend as StatCardTrend | undefined}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
