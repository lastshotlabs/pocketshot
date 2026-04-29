import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { CardBase } from './standalone'
import type { CardConfig } from './types'

export function Card({ config, children }: { config: CardConfig; children?: React.ReactNode }) {
  const { dispatch, values } = useScreenContext()

  const resolvedTitle =
    config.title == null
      ? undefined
      : isFromRef(config.title)
        ? String(resolveFromRef(config.title, values) ?? '')
        : config.title
  const resolvedSubtitle =
    config.subtitle == null
      ? undefined
      : isFromRef(config.subtitle)
        ? String(resolveFromRef(config.subtitle, values) ?? '')
        : config.subtitle

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <CardBase
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
        padding={config.padding as string | number | undefined}
        gap={config.gap as string | number | undefined}
        borderRadius={config.borderRadius as string | number | undefined}
        shadow={config.shadow as string | undefined}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      >
        {children}
      </CardBase>
    </ComponentWrapper>
  )
}
