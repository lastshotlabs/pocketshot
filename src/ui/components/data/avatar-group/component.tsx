import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { AvatarGroupBase, type AvatarGroupItem, type AvatarGroupSize } from './standalone'
import type { AvatarGroupConfig } from './types'

export function AvatarGroup({ config }: { config: AvatarGroupConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedAvatars: AvatarGroupItem[] = isFromRef(config.avatars)
    ? ((resolveFromRef(
        config.avatars as { from: string },
        values,
      ) as unknown as AvatarGroupItem[]) ?? [])
    : (config.avatars as unknown as AvatarGroupItem[])

  const handlePress = useCallback(async () => {
    if (!config.onPress) return
    await dispatch(config.onPress)
  }, [config.onPress, dispatch])

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <AvatarGroupBase
        avatars={resolvedAvatars}
        size={(config.size ?? 'sm') as AvatarGroupSize}
        overlap={config.overlap ?? 8}
        maxVisible={config.maxVisible ?? 4}
        onPress={config.onPress ? handlePress : undefined}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
