import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef, isFromRef } from '../../_base/fromRef'
import { ToggleBase } from './standalone'
import type { ToggleConfig } from './types'

export function Toggle({ config }: { config: ToggleConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null
      ? (resolveFromRef(config.value, values) as boolean | undefined)
      : undefined
  const resolvedDisabled =
    config.disabled != null
      ? (resolveFromRef(config.disabled, values) as boolean | undefined)
      : undefined
  const resolvedLabel =
    config.label != null
      ? isFromRef(config.label)
        ? (resolveFromRef(config.label, values) as unknown as string | undefined)
        : (config.label as string)
      : undefined

  const handleChange = useCallback(
    (next: boolean) => {
      setValue(config.id, next)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const disabled = resolvedDisabled ?? false
  const activeStates: ('selected' | 'disabled')[] | undefined = disabled
    ? ['disabled']
    : resolvedValue
      ? ['selected']
      : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <ToggleBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onValueChange={handleChange}
        label={resolvedLabel}
        icon={config.icon}
        variant={config.variant}
        size={config.size}
        disabled={disabled}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
