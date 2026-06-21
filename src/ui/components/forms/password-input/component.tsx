import React, { useCallback } from 'react'
import { ComponentWrapper } from '../../_base/ComponentWrapper'
import { useScreenContext } from '../../../context/ScreenContext'
import { resolveFromRef } from '../../_base/fromRef'
import { PasswordInputBase } from './standalone'
import type { PasswordInputConfig } from './types'

export function PasswordInput({ config }: { config: PasswordInputConfig }) {
  const { setValue, dispatch, values } = useScreenContext()

  const resolvedValue =
    config.value != null ? (resolveFromRef(config.value, values) as string | undefined) : undefined
  const resolvedError =
    config.errorText != null
      ? (resolveFromRef(config.errorText, values) as string | undefined)
      : undefined

  const handleChange = useCallback(
    (text: string) => {
      setValue(config.id, text)
      if (config.onChangeAction) void dispatch(config.onChangeAction)
    },
    [config.id, config.onChangeAction, dispatch, setValue],
  )

  const handleSubmit = useCallback(() => {
    if (config.onSubmitAction) void dispatch(config.onSubmitAction)
  }, [config.onSubmitAction, dispatch])

  const activeStates: ('invalid' | 'focus')[] | undefined = resolvedError ? ['invalid'] : undefined

  return (
    <ComponentWrapper
      id={config.id}
      testID={config.testID}
      config={config}
      activeStates={activeStates}
    >
      <PasswordInputBase
        id={config.id}
        value={resolvedValue}
        defaultValue={config.defaultValue}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        label={config.label}
        placeholder={config.placeholder}
        helperText={config.helperText}
        errorText={resolvedError}
        showToggle={config.showToggle}
        autoComplete={config.autoComplete}
        maxLength={config.maxLength}
        slots={config.slots as Record<string, Record<string, unknown>> | undefined}
        testID={config.testID}
      />
    </ComponentWrapper>
  )
}
