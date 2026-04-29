import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { BadgeBase, type BadgeSize, type BadgeVariant } from './standalone'
import type { BadgeConfig } from './types'

export function Badge({ config }: { config: BadgeConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedLabel = isFromRef(config.label)
    ? String(resolveFromRef(config.label, values) ?? '')
    : config.label

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <BadgeBase
        label={resolvedLabel}
        variant={(config.variant ?? 'default') as BadgeVariant}
        size={(config.size ?? 'md') as BadgeSize}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
