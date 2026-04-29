import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { AvatarBase, type AvatarShape, type AvatarSize } from './standalone'
import type { AvatarConfig } from './types'

export function Avatar({ config }: { config: AvatarConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedSrc = config.src
    ? isFromRef(config.src)
      ? String(resolveFromRef(config.src, values) ?? '')
      : config.src
    : undefined

  const resolvedName = config.name
    ? isFromRef(config.name)
      ? String(resolveFromRef(config.name, values) ?? '')
      : config.name
    : undefined

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AvatarBase
        src={resolvedSrc}
        name={resolvedName}
        size={(config.size ?? 'md') as AvatarSize}
        shape={(config.shape ?? 'circle') as AvatarShape}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
