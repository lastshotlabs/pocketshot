import React, { useCallback, useMemo } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import {
  FavoriteButtonBase,
  type FavoriteButtonSize,
  type FavoriteButtonVariant,
} from './standalone'
import type { FavoriteButtonConfig } from './types'

export function FavoriteButton({ config }: { config: FavoriteButtonConfig }) {
  const { dispatch, setValue, values } = useScreenContext()

  const controlledValue = useMemo<boolean | undefined>(() => {
    if (config.value === undefined) return undefined
    if (isFromRef(config.value)) {
      return resolveFromRef(config.value as unknown as boolean, values) as boolean | undefined
    }
    return config.value as unknown as boolean
  }, [config.value, values])

  const handlePress = useCallback(
    async (next: boolean) => {
      if (config.id) setValue(config.id, next)
      if (config.onToggleAction) {
        await dispatch(config.onToggleAction)
      }
    },
    [config.id, config.onToggleAction, dispatch, setValue],
  )

  return (
    <ComponentWrapper id={config.id} testID={config.testID} config={config}>
      <FavoriteButtonBase
        value={controlledValue}
        defaultValue={config.defaultValue}
        variant={(config.variant ?? 'heart') as FavoriteButtonVariant}
        size={(config.size ?? 'md') as FavoriteButtonSize}
        activeColor={config.activeColor}
        onPress={(v) => void handlePress(v)}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
        id={config.id}
      />
    </ComponentWrapper>
  )
}
