import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { ButtonBase } from './standalone'
import type { ButtonConfig } from './types'

export function Button({ config }: { config: ButtonConfig }) {
  const { dispatch, values } = useScreenContext()

  const resolvedLabel = isFromRef(config.label)
    ? String(resolveFromRef(config.label, values) ?? '')
    : config.label
  const resolvedLoading = isFromRef(config.loading)
    ? Boolean(resolveFromRef(config.loading, values))
    : Boolean(config.loading)
  const resolvedDisabled = isFromRef(config.disabled)
    ? Boolean(resolveFromRef(config.disabled, values))
    : Boolean(config.disabled)

  const handlePress = useCallback(async () => {
    if (resolvedDisabled || resolvedLoading) return
    await dispatch({ type: 'haptic', style: 'light' })
    await dispatch(config.onPress)
  }, [config.onPress, dispatch, resolvedDisabled, resolvedLoading])

  const activeStates = resolvedDisabled || resolvedLoading ? (['disabled'] as const) : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates ? [...activeStates] : undefined}
    >
      <ButtonBase
        id={config.id}
        label={resolvedLabel}
        variant={config.variant ?? 'primary'}
        size={config.size ?? 'md'}
        loading={resolvedLoading}
        disabled={resolvedDisabled}
        fullWidth={config.fullWidth ?? false}
        iconLeft={config.iconLeft}
        iconRight={config.iconRight}
        onPress={handlePress}
        testID={config.testID}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
      />
    </ComponentWrapper>
  )
}
